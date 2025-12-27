using UnityEngine;
using System.Collections.Generic;

namespace DungeonGame
{
    public static class Pathfinder
    {
        public static Vector2Int? FindPath(Vector2Int start, Vector2Int target, TileType[,] map)
        {
            int width = map.GetLength(0);
            int height = map.GetLength(1);

            BinaryHeap<PathNode> openSet = new BinaryHeap<PathNode>();
            Dictionary<string, PathNode> openSetNodes = new Dictionary<string, PathNode>();
            HashSet<string> closedSet = new HashSet<string>();

            PathNode startNode = new PathNode(start.x, start.y);
            startNode.f = Heuristic(start, target);
            openSet.Push(startNode);
            openSetNodes[$"{start.x},{start.y}"] = startNode;

            int iterations = 0;
            int maxIterations = 2000;

            while (openSet.Count > 0)
            {
                iterations++;
                if (iterations > maxIterations) return null;

                PathNode current = openSet.Pop();
                string currentKey = $"{current.x},{current.y}";
                openSetNodes.Remove(currentKey);

                if (current.x == target.x && current.y == target.y)
                {
                    // Reconstruct
                    // Returns the NEXT step, not the full path list, to match original TS behavior
                    // Or actually, TS returns the NEXT immediate step? Let's check TS again.
                    // TS: return inverted.length > 0 ? inverted[0] : null; -> Returns the immediate next position.
                    return ReconstructNextStep(current);
                }

                closedSet.Add(currentKey);

                // Neighbors
                Vector2Int[] offsets = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };
                foreach (var offset in offsets)
                {
                    int nx = current.x + offset.x;
                    int ny = current.y + offset.y;
                    string nKey = $"{nx},{ny}";

                    if (closedSet.Contains(nKey)) continue;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    
                    // Simple wall check
                    if (map[nx, ny] == TileType.WALL && !(nx == target.x && ny == target.y)) continue;

                    int gScore = current.g + 1;
                    
                    PathNode existing;
                    if (!openSetNodes.TryGetValue(nKey, out existing))
                    {
                        PathNode neighbor = new PathNode(nx, ny);
                        neighbor.g = gScore;
                        neighbor.f = gScore + Heuristic(new Vector2Int(nx, ny), target);
                        neighbor.parent = current;
                        
                        openSet.Push(neighbor);
                        openSetNodes[nKey] = neighbor;
                    }
                    else if (gScore < existing.g)
                    {
                        existing.g = gScore;
                        existing.f = gScore + Heuristic(new Vector2Int(nx, ny), target);
                        existing.parent = current;
                        openSet.Rescore(existing);
                    }
                }
            }

            return null;
        }

        private static int Heuristic(Vector2Int a, Vector2Int b)
        {
            return Mathf.Abs(a.x - b.x) + Mathf.Abs(a.y - b.y);
        }

        private static Vector2Int? ReconstructNextStep(PathNode node)
        {
            List<Vector2Int> path = new List<Vector2Int>();
            PathNode current = node;
            while (current.parent != null)
            {
                path.Add(new Vector2Int(current.x, current.y));
                current = current.parent;
            }
            if (path.Count > 0) return path[path.Count - 1]; // Last element is the first step from start
            return null;
        }
    }

    public class PathNode : System.IComparable<PathNode>
    {
        public int x, y;
        public int g, f;
        public PathNode parent;

        public PathNode(int x, int y) { this.x = x; this.y = y; }

        public int CompareTo(PathNode other)
        {
            if (this.f < other.f) return -1;
            if (this.f > other.f) return 1;
            return 0;
        }
    }

    // Min-Heap implementation
    public class BinaryHeap<T> where T : System.IComparable<T>
    {
        private List<T> items = new List<T>();

        public int Count => items.Count;

        public void Push(T item)
        {
            items.Add(item);
            BubbleUp(items.Count - 1);
        }

        public T Pop()
        {
            if (items.Count == 0) return default(T);
            T first = items[0];
            T last = items[items.Count - 1];
            items.RemoveAt(items.Count - 1);
            if (items.Count > 0)
            {
                items[0] = last;
                BubbleDown(0);
            }
            return first;
        }

        public void Rescore(T item)
        {
            int index = items.IndexOf(item);
            if (index >= 0)
            {
                BubbleUp(index);
                BubbleDown(index);
            }
        }

        private void BubbleUp(int index)
        {
            while (index > 0)
            {
                int parent = (index - 1) / 2;
                if (items[index].CompareTo(items[parent]) >= 0) break;
                Swap(index, parent);
                index = parent;
            }
        }

        private void BubbleDown(int index)
        {
            while (true)
            {
                int left = index * 2 + 1;
                int right = index * 2 + 2;
                int smallest = index;

                if (left < items.Count && items[left].CompareTo(items[smallest]) < 0) smallest = left;
                if (right < items.Count && items[right].CompareTo(items[smallest]) < 0) smallest = right;

                if (smallest == index) break;
                Swap(index, smallest);
                index = smallest;
            }
        }

        private void Swap(int a, int b) { T temp = items[a]; items[a] = items[b]; items[b] = temp; }
    }
}
