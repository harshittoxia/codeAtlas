export type NodeType = "SOURCE" | "DECISION" | "ACTION" | "PROCESS" | "SINK";

export interface MethodNode {
    id: string;
    name: string;
    filePath: string;
    startLine: number;
    endLine: number;
    calls: string[];
    nodeType?: NodeType;
    icon?: string;
    color?: string;
    borderColor?: string;
    category?: string;
    description?: string;
    sourceCode?: string;
}

export interface CallGraph {
    nodes: Map<string, MethodNode>;
}