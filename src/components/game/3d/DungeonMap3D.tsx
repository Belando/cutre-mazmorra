import { useMemo, useLayoutEffect, memo } from 'react';
import { Instances, Instance, useGLTF } from '@react-three/drei';
import { TILE } from '@/data/constants';
import * as THREE from 'three';
// import { Model as WallModel } from './WallModel'; // Replaced by Instances
// import { Model as WallModel2 } from './WallModel2'; // Replaced by Instances
// import { Model as WallCornerModel } from './WallCornerModel'; // Replaced by Instances
// import { Model as FloorModel } from './FloorModel'; // Replaced by Instances
import { Model as TorchModel } from './TorchModel';
import { Model as DoorModel } from './DoorModel';
import { GLTF } from 'three-stdlib';

interface DungeonMap3DProps {
    map: number[][];
    visible: boolean[][];
    explored: boolean[][];
}

type GLTFResult = GLTF & {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.MeshStandardMaterial>;
}

function DungeonMap3D({ map, visible, explored }: DungeonMap3DProps) {
    // --- LOAD MODELS ---
    const floorGLTF = useGLTF('/models/floor.glb') as unknown as GLTFResult;
    const wallGLTF = useGLTF('/models/wall.glb') as unknown as GLTFResult;
    const wall2GLTF = useGLTF('/models/wall2.glb') as unknown as GLTFResult;
    const cornerGLTF = useGLTF('/models/wallcorner.glb') as unknown as GLTFResult;

    // --- PREPARE GEOMETRIES & MATERIALS ---

    // 1. Floor
    const floorNode = floorGLTF.nodes.Suelo_1x1_Cuadrado_Rocoso_Muy_Oscuro;
    const floorMat = floorNode.material as THREE.MeshStandardMaterial || Object.values(floorGLTF.materials)[0];

    // 2. Wall 1 (Horizontal)
    const wallNode = wallGLTF.nodes.Muro_Ladrillo_Rojo_Final || Object.values(wallGLTF.nodes).find(n => n.isMesh);
    const wallMat = Object.values(wallGLTF.materials)[0];

    // 3. Wall 2 (Vertical - "Block")
    const wall2Node = wall2GLTF.nodes.Bloque_1x05x2;
    const wall2Mat = wall2GLTF.materials['Mat_Solido_Oscuro.003'] || Object.values(wall2GLTF.materials)[0];

    // 4. Corner (Multimesh - we will render 2 instances per corner or just the main block depending on visual needs)
    // Corner has Block 1 and Block 2. We will render them as two separate instance pools for simplicity if needed, 
    // OR just use the main block if it looks "good enough" for now to save logic.
    // Actually, Corner uses the SAME material/geo as Wall 2 mostly? 
    // Let's use the explicit corner nodes.
    const cornerNode1 = cornerGLTF.nodes.Bloque_1x05x2;
    const cornerNode2 = cornerGLTF.nodes.Bloque_1x05x2001;
    const cornerMat = cornerGLTF.materials['Mat_Solido_Oscuro.003'];

    // --- CONFIGURE MATERIALS (Once) ---
    useLayoutEffect(() => {
        const setupMat = (mat: THREE.MeshStandardMaterial, color: string) => {
            if (!mat) return;
            mat.vertexColors = false;
            mat.map = null;
            mat.color = new THREE.Color(color);
            mat.roughness = 0.9;
            mat.metalness = 0.0;
            mat.emissive = new THREE.Color(0, 0, 0);
            mat.needsUpdate = true;
        };

        setupMat(floorMat, '#57534e');
        setupMat(wallMat, '#64748b');
        setupMat(wall2Mat, '#64748b'); // Same color for consistency
        setupMat(cornerMat, '#64748b');

    }, [floorMat, wallMat, wall2Mat, cornerMat]);


    // --- BUCKET DATA ---
    const { floorInstances, wallInstances, wall2Instances, cornerInstances, torchInstances, doorInstances } = useMemo(() => {
        const floors: any[] = [];
        const walls: any[] = [];
        const walls2: any[] = [];
        const corners: any[] = [];
        const torches: any[] = [];
        const doors: any[] = [];

        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                const isExplored = explored[y]?.[x];
                const isVisible = visible[y]?.[x];

                if (!isExplored) return;

                // --- FLOOR ---
                // Render floor for everything EXCEPT Walls? Or just everything?
                // Original logic: Render floor if explored.
                // FloorModel was previously:
                floors.push({
                    key: `fl-${x}-${y}`,
                    position: [x, 0, y] as [number, number, number],
                    rotation: [0, (x + y) % 2 === 0 ? 0 : Math.PI / 2, 0] as [number, number, number],
                    visible: isVisible // We can handle visibility by not rendering or scaling to 0? Instance prop "visible" works?
                    // Note: <Instance> supports props transparently if supported by drei.
                    // If not, we can scale to 0 if not visible.
                    // Actually, fog handles visibility mostly.
                    // But "Not Visible" (FOW) usually means "Hidden" or "Darkened".
                    // For now, let's assume always rendered if explored, and lighting handles the rest?
                    // Logic was: visible={tile.isVisible} -> if !visible, React Three Fiber hides it?
                    // Check usage: FOW usually hides UNEXPLORED. Explored but not visible = Shrouded (Dark).
                    // In this game: "visible" prop in FloorModel just passed it to group?
                    // Let's assume we render all explored.
                });

                if (cell === TILE.WALL) {
                    // --- WALL LOGIC ---
                    const isFloor = (tx: number, ty: number) => map[ty]?.[tx] !== undefined && map[ty]?.[tx] !== TILE.WALL;

                    const openN = isFloor(x, y - 1);
                    const openS = isFloor(x, y + 1);
                    const openW = isFloor(x - 1, y);
                    const openE = isFloor(x + 1, y);
                    const openNE = isFloor(x + 1, y - 1);
                    const openSE = isFloor(x + 1, y + 1);
                    const openNW = isFloor(x - 1, y - 1);
                    const openSW = isFloor(x - 1, y + 1);

                    const hasOpenNS = openN || openS;
                    const hasOpenEW = openW || openE;
                    const isOrthogonal = !openN && !openS && !openW && !openE;

                    let type = 'wall'; // wall, wall2, corner
                    let rotation: [number, number, number] = [0, 0, 0];
                    let xOff = 0;
                    let zOff = 0;
                    const OFFSET = 0.35;

                    if (hasOpenNS) {
                        type = 'wall'; // Horizontal
                        rotation = [0, Math.PI / 2, 0];
                    } else if (hasOpenEW) {
                        type = 'wall2'; // Vertical
                        rotation = [0, 0, 0];
                    }
                    if (hasOpenNS && hasOpenEW) {
                        type = 'wall';
                        rotation = [0, Math.PI / 2, 0];
                    }

                    // Orthogonal Offsets
                    if (openN) zOff += OFFSET;
                    if (openS) zOff -= OFFSET;
                    if (openW) xOff += OFFSET;
                    if (openE) xOff -= OFFSET;

                    // Corner Logic
                    if (isOrthogonal) {
                        // Check Diagonals
                        if (openNE || openSE || openNW || openSW) {
                            type = 'corner';
                            if (openNE) rotation = [0, -Math.PI / 2, 0];
                            if (openSE) rotation = [0, Math.PI, 0];
                            if (openSW) rotation = [0, Math.PI / 2, 0];
                            if (openNW) rotation = [0, 0, 0];

                            const CX = 0.075;
                            const CZ = 0.37;
                            if (openNE) { xOff -= CX; zOff += CZ; }
                            if (openSE) { xOff -= CX; zOff -= CZ; }
                            if (openNW) { xOff += CX; zOff += CZ; }
                            if (openSW) { xOff += CX; zOff -= CZ; }
                        }
                    }

                    const pos: [number, number, number] = [x + xOff, 0, y + zOff];
                    const instanceData = { key: `w-${x}-${y}`, position: pos, rotation };

                    if (type === 'wall') walls.push(instanceData);
                    else if (type === 'wall2') walls2.push(instanceData);
                    else if (type === 'corner') corners.push(instanceData);

                    // --- TORCH LOGIC ---
                    const pseudoRandom = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
                    const hasTorch = (pseudoRandom - Math.floor(pseudoRandom)) > 0.85;

                    if (hasTorch && isVisible) {
                        let tPos: [number, number, number] | null = null;
                        let tRot: [number, number, number] = [0, 0, 0];

                        if (map[y + 1]?.[x] !== TILE.WALL) { tPos = [x, 1, y + 0.55]; tRot = [0, 0, 0]; }
                        else if (map[y - 1]?.[x] !== TILE.WALL) { tPos = [x, 1, y - 0.55]; tRot = [0, Math.PI, 0]; }
                        else if (map[y]?.[x + 1] !== TILE.WALL) { tPos = [x + 0.55, 1, y]; tRot = [0, -Math.PI / 2, 0]; }
                        else if (map[y]?.[x - 1] !== TILE.WALL) { tPos = [x - 0.55, 1, y]; tRot = [0, Math.PI / 2, 0]; }

                        if (tPos) {
                            torches.push({ key: `t-${x}-${y}`, position: tPos, rotation: tRot });
                        }
                    }

                } else if (cell === TILE.DOOR || cell === TILE.DOOR_OPEN) {
                    // --- DOOR --- (Keep as component)
                    const isHorizontal = map[y]?.[x - 1] === TILE.WALL || map[y]?.[x + 1] === TILE.WALL;
                    doors.push({
                        key: `door-${x}-${y}`,
                        position: [x, 0, y] as [number, number, number],
                        rotation: isHorizontal ? [0, 0, 0] : [0, Math.PI / 2, 0] as [number, number, number],
                        isOpen: cell === TILE.DOOR_OPEN
                    });
                }
            });
        });

        return { floorInstances: floors, wallInstances: walls, wall2Instances: walls2, cornerInstances: corners, torchInstances: torches, doorInstances: doors };
    }, [map, visible, explored]);

    return (
        <group>
            {/* --- INSTANCED FLOORS --- */}
            {floorNode && (
                <Instances range={floorInstances.length} geometry={floorNode.geometry} material={floorMat} receiveShadow>
                    {floorInstances.map((data) => (
                        <Instance key={data.key} position={data.position} rotation={data.rotation} />
                    ))}
                </Instances>
            )}

            {/* --- INSTANCED WALLS (Horizontal) --- */}
            {wallNode && (
                <Instances range={wallInstances.length} geometry={wallNode.geometry} material={wallMat} castShadow receiveShadow>
                    {wallInstances.map((data) => (
                        <Instance position={[data.position[0], 1, data.position[2]]} rotation={data.rotation} key={data.key} />
                    ))}
                </Instances>
            )}

            {/* --- INSTANCED WALLS 2 (Vertical Block) --- */}
            {wall2Node && (
                <Instances range={wall2Instances.length} geometry={wall2Node.geometry} material={wall2Mat} castShadow receiveShadow>
                    {wall2Instances.map((data) => (
                        <Instance position={[data.position[0], 1, data.position[2]]} rotation={data.rotation} key={data.key} />
                    ))}
                </Instances>
            )}

            {/* --- INSTANCED CORNERS --- */}
            {/* Corner Part 1 */}
            {cornerNode1 && (
                <Instances range={cornerInstances.length} geometry={cornerNode1.geometry} material={cornerMat} castShadow receiveShadow>
                    {cornerInstances.map((data) => (
                        <Instance position={[data.position[0], 1, data.position[2]]} rotation={data.rotation} key={`${data.key}-1`} />
                    ))}
                </Instances>
            )}


            {/* --- DOORS (Standard Components) --- */}
            {doorInstances.map(d => (
                <DoorModel key={d.key} position={d.position} rotation={d.rotation} isOpen={d.isOpen} />
            ))}

            {/* --- TORCHES (Standard Components for now to keep lights working easily) --- */}
            {torchInstances.map(t => (
                <TorchModel key={t.key} position={t.position} rotation={t.rotation} scale={[2, 2, 2]} />
            ))}

        </group>
    );
}

useGLTF.preload('/models/floor.glb');
useGLTF.preload('/models/wall.glb');
useGLTF.preload('/models/wall2.glb');
useGLTF.preload('/models/wallcorner.glb');

const DungeonMap3DMemo = memo(DungeonMap3D, (prev, next) => {
    return prev.map === next.map && prev.visible === next.visible && prev.explored === next.explored;
});

export { DungeonMap3DMemo as DungeonMap3D };
