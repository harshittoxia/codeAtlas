import * as vscode from 'vscode';
import { loadProject } from '../parser/projectScanner';
import { CallGraph } from '../types/graphTypes';
import { SyntaxKind } from "ts-morph";

export async function generateCallGraph(context: vscode.ExtensionContext) {

    const project = loadProject();
    if (!project) return;

    const graph: CallGraph = {
        nodes: new Map()
    };

    vscode.window.showInformationMessage("Scanning project...");

    // =========================
    // STEP 1 — Add Class + Methods
    // =========================
    project.getSourceFiles().forEach(file => {

        file.getClasses().forEach(cls => {

            const className = cls.getName() || "UnknownClass";

            // Add class node
            if (!graph.nodes.has(className)) {
                graph.nodes.set(className, {
                    id: className,
                    name: className,
                    filePath: file.getFilePath(),
                    startLine: 0,
                    endLine: 0,
                    calls: []
                });
            }

            cls.getMethods().forEach(method => {

                const methodName = method.getName();
                const methodId = `${className}.${methodName}`;

                graph.nodes.set(methodId, {
                    id: methodId,
                    name: methodName,
                    filePath: file.getFilePath(),
                    startLine: method.getStartLineNumber(),
                    endLine: method.getEndLineNumber(),
                    calls: [],
                    sourceCode: method.getText()
                });

                // Connect Class → Method
                graph.nodes.get(className)?.calls.push(methodId);
            });
        });
    });

    // =========================
    // STEP 2 — Detect Internal Method Calls Only
    // =========================
    project.getSourceFiles().forEach(file => {

        file.getClasses().forEach(cls => {

            const className = cls.getName() || "UnknownClass";

            cls.getMethods().forEach(method => {

                const callerId = `${className}.${method.getName()}`;
                const callerNode = graph.nodes.get(callerId);
                if (!callerNode) return;

                const callExpressions =
                    method.getDescendantsOfKind(SyntaxKind.CallExpression);

                callExpressions.forEach(callExpr => {

                    const expression = callExpr.getExpression();
                    const callName = expression.getText();

                    // Try matching with existing project methods
                    graph.nodes.forEach(existingNode => {

                        if (
                            existingNode.id !== callerId &&
                            (
                                callName.endsWith(existingNode.name) ||
                                callName.includes(existingNode.name)
                            )
                        ) {
                            callerNode.calls.push(existingNode.id);
                        }
                    });
                });
            });
        });
    });

    vscode.window.showInformationMessage(
        `Discovered ${graph.nodes.size} nodes.`
    );

    console.log(graph);

    // =========================
    // STEP 3 — Classify Nodes and Assign Icons
    // =========================

    const incomingCount = new Map<string, number>();
    graph.nodes.forEach(node => {
        incomingCount.set(node.id, 0);
    });

    // Count incoming edges
    graph.nodes.forEach(node => {
        node.calls.forEach(callId => {
            incomingCount.set(callId, (incomingCount.get(callId) || 0) + 1);
        });
    });

    // Classify nodes based on call graph patterns
    graph.nodes.forEach(node => {
        const outgoingCount = node.calls.length;
        const inCount = incomingCount.get(node.id) || 0;

        if (outgoingCount > 2 && inCount === 0) {
            // Entry point - calls many, called by none
            node.nodeType = "SOURCE";
            node.icon = "▶";
            node.color = "#f97316"; // orange
        } else if (outgoingCount > 1 && inCount > 0) {
            // Decision point - calls multiple and is called
            node.nodeType = "DECISION";
            node.icon = "◇";
            node.color = "#64748b"; // slate gray
        } else if (inCount > 1 && outgoingCount === 0) {
            // Action/Result node - called by many, calls none
            node.nodeType = "ACTION";
            node.icon = "⚡";
            node.color = "#f97316"; // orange
        } else if (outgoingCount > 0 && inCount > 0) {
            // Process node - in the middle
            node.nodeType = "PROCESS";
            node.icon = "⚙";
            node.color = "#06b6d4"; // cyan
        } else {
            // Sink node - no clear role
            node.nodeType = "SINK";
            node.icon = "◉";
            node.color = "#8b5cf6"; // violet
        }
    });

    // =========================
    // STEP 3b — Convert Graph to Cytoscape JSON
    // =========================

    const elements: any[] = [];

    graph.nodes.forEach(node => {

        const safeId = node.id.replace(/[^\w]/g, "_");

        const isClass = !node.id.includes(".");

        elements.push({
            data: {
                id: safeId,
                label: isClass ? node.name : `${node.name}()`,
                type: isClass ? "class" : "method",
                nodeType: node.nodeType,
                icon: node.icon,
                color: node.color,
                filePath: node.filePath,
                sourceCode: node.sourceCode,
                startLine: node.startLine,
                endLine: node.endLine
            }
        });

        node.calls.forEach(callId => {

            const safeTarget = callId.replace(/[^\w]/g, "_");

            elements.push({
                data: {
                    id: `${safeId}_${safeTarget}`,
                    source: safeId,
                    target: safeTarget
                }
            });
        });
    });

    // =========================
    // STEP 4 — Open Interactive Webview
    // =========================

    const panel = vscode.window.createWebviewPanel(
        "codeAtlasGraph",
        "CodeAtlas Call Graph",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://unpkg.com/cytoscape/dist/cytoscape.min.js"></script>

<style>
* {
    box-sizing: border-box;
}

html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

body {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    font-family: 'Segoe UI', sans-serif;
}

#cy {
    width: 100%;
    height: 100%;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
}

.cy-node-class {
    background-color: #1e293b;
    border: 2px solid #3b82f6;
    color: white;
}

.cy-node-method {
    background-color: #0f172a;
    border: 2px solid #22c55e;
    color: #e2e8f0;
}

/* Floating Window Styles */
.floating-window {
    position: fixed;
    background: #1e293b;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.5);
    z-index: 1000;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s ease;
    display: flex;
    flex-direction: column;
    max-width: 600px;
    max-height: 80vh;
    min-width: 400px;
}

.floating-window.visible {
    visibility: visible;
    opacity: 1;
}

.window-header {
    background: linear-gradient(135deg, #3b82f6, #1e40af);
    padding: 12px 16px;
    border-bottom: 1px solid #0f172a;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
    border-radius: 6px 6px 0 0;
}

.window-title {
    color: white;
    font-weight: 600;
    font-size: 14px;
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 20px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.window-content {
    flex: 1;
    overflow: auto;
    padding: 16px;
    color: #e2e8f0;
}

.method-info {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.info-label {
    color: #94a3b8;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

.info-value {
    color: #e2e8f0;
    font-size: 13px;
    word-break: break-all;
}

.code-block {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 4px;
    padding: 12px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    overflow: auto;
    white-space: pre;
    line-height: 1.5;
    color: #a1e6ff;
    max-height: 300px;
}

/* Scrollbar styling */
.window-content::-webkit-scrollbar,
.code-block::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.window-content::-webkit-scrollbar-track,
.code-block::-webkit-scrollbar-track {
    background: rgba(51, 65, 85, 0.5);
    border-radius: 4px;
}

.window-content::-webkit-scrollbar-thumb,
.code-block::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 4px;
}

.window-content::-webkit-scrollbar-thumb:hover,
.code-block::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>
</head>

<body>

<div id="cy"></div>

<div class="floating-window" id="methodWindow">
    <div class="window-header">
        <p class="window-title" id="methodName">Method Details</p>
        <button class="close-btn" id="closeBtn">×</button>
    </div>
    <div class="window-content">
        <div class="method-info">
            <div>
                <div class="info-label">File Path</div>
                <div class="info-value" id="filePath"></div>
            </div>
            <div>
                <div class="info-label">Lines</div>
                <div class="info-value" id="lineNumbers"></div>
            </div>
        </div>
        <div>
            <div class="info-label">Source Code</div>
            <div class="code-block" id="sourceCode"></div>
        </div>
    </div>
</div>

<script>
const vscode = acquireVsCodeApi();

// Initialize cytoscape
try {
    const elements = ${JSON.stringify(elements)};
    
    // Calculate horizontal layout positions - classes on left, methods on right
    const positions = {};
    const classNodes = [];
    const methodNodes = [];
    
    elements.forEach(el => {
        if (el.data && el.data.type === 'class') {
            classNodes.push(el.data.id);
        } else if (el.data && el.data.type === 'method') {
            methodNodes.push(el.data.id);
        }
    });
    
    // Position classes on the left in vertical line
    const classHeight = 100;
    classNodes.forEach((nodeId, index) => {
        positions[nodeId] = {
            x: 100,
            y: 100 + index * classHeight
        };
    });
    
    // Position methods on the right in vertical line
    const methodHeight = 100;
    methodNodes.forEach((nodeId, index) => {
        positions[nodeId] = {
            x: 600,
            y: 100 + index * methodHeight
        };
    });
    
    // Add positions to elements
    elements.forEach(el => {
        if (el.data && positions[el.data.id]) {
            el.position = positions[el.data.id];
        }
    });

    const cy = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'color': '#fff',
                    'background-color': '#1e293b',
                    'border-width': 2.5,
                    'border-color': '#3b82f6',
                    'shape': 'rectangle',
                    'width': 'label',
                    'padding': '10px 20px',
                    'font-size': 13,
                    'font-weight': 'bold',
                    'min-zoomed-font-size': 11
                }
            },
            {
                selector: 'node[type="method"]',
                style: {
                    'border-color': '#22c55e',
                    'background-color': '#0f172a'
                }
            },
            {
                selector: 'edge',
                style: {
                    'curve-style': 'straight-cw',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#f59e0b',
                    'line-color': '#f59e0b',
                    'width': 3,
                    'opacity': 1,
                    'z-index': 1,
                    'arrow-scale': 1.8,
                    'line-style': 'solid'
                }
            }
        ],
        layout: {
            name: 'preset',
            padding: 50,
            animate: true,
            animationDuration: 500
        }
    });

    // Fit graph to view after layout
    setTimeout(() => {
        cy.fit(cy.elements(), 80);
        cy.center();
    }, 800);

    // Floating window management
    const methodWindow = document.getElementById('methodWindow');
    const closeBtn = document.getElementById('closeBtn');
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Close button handler
    closeBtn.addEventListener('click', () => {
        methodWindow.classList.remove('visible');
    });

    // Drag window handler
    const header = document.querySelector('.window-header');
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffsetX = e.clientX - methodWindow.offsetLeft;
        dragOffsetY = e.clientY - methodWindow.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            methodWindow.style.left = (e.clientX - dragOffsetX) + 'px';
            methodWindow.style.top = (e.clientY - dragOffsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Node click handler to show method details
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        const data = node.data();
        
        if (data.type === 'method' && data.sourceCode) {
            // Populate method details
            document.getElementById('methodName').textContent = data.label;
            document.getElementById('filePath').textContent = data.filePath;
            document.getElementById('lineNumbers').textContent = \`\${data.startLine} - \${data.endLine}\`;
            document.getElementById('sourceCode').textContent = data.sourceCode;
            
            // Show floating window with initial position (mouse-relative)
            const pos = evt.renderedPosition;
            methodWindow.style.left = pos.x + 'px';
            methodWindow.style.top = pos.y + 'px';
            methodWindow.classList.add('visible');
        }
    });
} catch (err) {
    console.error('Cytoscape initialization error:', err);
    document.getElementById('cy').innerHTML = '<div style="color: #e2e8f0; padding: 20px;">Error loading graph. Check console.</div>';
}

</script>

</body>
</html>
`;
}