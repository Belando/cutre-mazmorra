export interface HeapItem {
    f: number;
    [key: string]: any;
}

export class BinaryHeap<T extends HeapItem> {
    content: T[];

    constructor() {
        this.content = [];
    }

    push(element: T) {
        this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    }

    pop(): T | undefined {
        const result = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0 && end) {
            this.content[0] = end;
            this.sinkDown(0);
        }
        return result;
    }

    remove(node: T) {
        const length = this.content.length;
        for (let i = 0; i < length; i++) {
            if (this.content[i] !== node) continue;
            const end = this.content.pop();
            if (i < length - 1 && end) {
                this.content[i] = end;
                if (end.f < node.f) {
                    this.bubbleUp(i);
                } else {
                    this.sinkDown(i);
                }
            }
            return;
        }
    }

    size() {
        return this.content.length;
    }

    rescoreElement(node: T) {
        this.sinkDown(this.content.indexOf(node));
    }

    private bubbleUp(n: number) {
        const element = this.content[n];
        while (n > 0) {
            const parentN = Math.floor((n + 1) / 2) - 1;
            const parent = this.content[parentN];
            if (element.f >= parent.f) break;
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }

    private sinkDown(n: number) {
        const length = this.content.length;
        const element = this.content[n];
        while (true) {
            const child2N = (n + 1) * 2;
            const child1N = child2N - 1;
            let swap: number | null = null;
            if (child1N < length) {
                const child1 = this.content[child1N];
                if (child1.f < element.f) swap = child1N;
            }
            if (child2N < length) {
                const child2 = this.content[child2N];
                if (child2.f < (swap === null ? element.f : this.content[child1N].f)) swap = child2N;
            }
            if (swap === null) break;
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
}
