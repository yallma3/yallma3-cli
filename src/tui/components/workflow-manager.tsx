// import React, { useEffect, useState } from 'react';
// import { Box, Text, useInput } from 'ink';
// import Spinner from 'ink-spinner';

// import fs from 'fs';
// import path from 'path';

// import { Paths } from '../../config/paths.js';
// import { WorkspaceStorage } from '../../storage/workspace.js';
// import { WorkspaceData } from '../../models/workspace.js';

// interface WorkflowManagerProps {
//   workspaceId: string;
//   onClose: () => void;
// }

// interface WorkflowDetails {
//   id: string;
//   name: string;
//   description?: string;
//   nodes: number;
//   connections: number;
// }

// export const WorkflowManager: React.FC<WorkflowManagerProps> = ({
//   workspaceId,
//   onClose,
// }) => {
//   const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
//   const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     void loadWorkspace();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const loadWorkflowDetails = async (
//     workflowRefs: Array<{ id: string; name: string; description?: string }>
//   ): Promise<WorkflowDetails[]> => {
//     const flowsDir = Paths.getWorkflowsDir();
//     const details: WorkflowDetails[] = [];

//     for (const ref of workflowRefs) {
//       try {
//         const flowPath = path.join(flowsDir, `${ref.id}.json`);

//         if (fs.existsSync(flowPath)) {
//           const content = fs.readFileSync(flowPath, 'utf-8');
//           const workflow = JSON.parse(content);

//           details.push({
//             id: ref.id,
//             name: ref.name,
//             description: ref.description,
//             nodes: workflow.canvasState?.nodes?.length ?? 0,
//             connections: workflow.canvasState?.connections?.length ?? 0,
//           });
//         } else {
//           details.push({
//             id: ref.id,
//             name: ref.name,
//             description: ref.description,
//             nodes: 0,
//             connections: 0,
//           });
//         }
//       } catch (err) {
//         // Keep going; show what can be loaded
//         console.error(`Failed to load workflow ${ref.id}:`, err);
//       }
//     }

//     return details;
//   };

//   const loadWorkspace = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const ws = WorkspaceStorage.load(workspaceId);
//       setWorkspace(ws);

//       const details = await loadWorkflowDetails(ws.workflows ?? []);
//       setWorkflowDetails(details);
//     } catch (err: any) {
//       setError(err?.message || 'Failed to load workspace');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useInput((_, key) => {
//     if (key.escape) onClose();
//   });

//   if (loading) {
//     return (
//       <Box>
//         <Text color="#f4c430">
//           <Spinner type="dots" />
//         </Text>
//         <Text color="#888888"> Loading workflows...</Text>
//       </Box>
//     );
//   }

//   if (error) {
//     return (
//       <Box flexDirection="column" paddingX={2}>
//         <Box marginBottom={1}>
//           <Text bold color="#ef4444">
//             Error Loading Workflows
//           </Text>
//         </Box>
//         <Box borderStyle="round" borderColor="#ef4444" padding={1}>
//           <Text color="#ef4444">{error}</Text>
//         </Box>
//         <Box marginTop={2}>
//           <Text color="#888888">ESC: Close</Text>
//         </Box>
//       </Box>
//     );
//   }

//   if (!workspace) {
//     return (
//       <Box flexDirection="column" paddingX={2}>
//         <Text color="#888888">Workspace not found</Text>
//         <Box marginTop={2}>
//           <Text color="#888888">ESC: Close</Text>
//         </Box>
//       </Box>
//     );
//   }

//   return (
//     <Box flexDirection="column" paddingX={2}>
//       <Box marginBottom={1}>
//         <Text bold color="#f4c430">
//           Tools & AI Workflows
//         </Text>
//       </Box>

//       <Box marginBottom={1}>
//         <Text color="#888888">Total: {workflowDetails.length} workflows</Text>
//       </Box>

//       {workflowDetails.length === 0 ? (
//         <Box
//           borderStyle="round"
//           borderColor="#3a3a3a"
//           padding={1}
//           flexDirection="column"
//         >
//           <Text color="#888888">No workflows in this workspace yet.</Text>
//           <Box marginTop={1}>
//             <Text color="#fbbf24">
//               Import workflows from the Studio application.
//             </Text>
//           </Box>
//           <Box marginTop={1}>
//             <Text color="#888888">
//               Workflows are stored in: ~/.yallma3/flows/
//             </Text>
//           </Box>
//         </Box>
//       ) : (
//         <Box
//           borderStyle="round"
//           borderColor="#3a3a3a"
//           padding={1}
//           flexDirection="column"
//         >
//           {workflowDetails.map((wf, i) => (
//             <Box
//               key={wf.id}
//               marginBottom={i < workflowDetails.length - 1 ? 1 : 0}
//               flexDirection="column"
//             >
//               <Box>
//                 <Text color="#60a5fa">{i + 1}. </Text>
//                 <Text bold color="#e0e0e0">
//                   {wf.name}
//                 </Text>
//               </Box>

//               {wf.description && (
//                 <Box marginLeft={3}>
//                   <Text color="#888888">{wf.description}</Text>
//                 </Box>
//               )}

//               <Box marginLeft={3}>
//                 <Text color="#888888">
//                   ID: {wf.id.substring(0, 12)} | Nodes: {wf.nodes} | Connections:{' '}
//                   {wf.connections}
//                 </Text>
//               </Box>
//             </Box>
//           ))}
//         </Box>
//       )}

//       <Box marginTop={2}>
//         <Text color="#888888">ESC: Close</Text>
//       </Box>
//     </Box>
//   );
// };
// src/tui/components/workflow-manager.tsx - FIXED VERSION
import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';

import fs from 'fs';
import path from 'path';

import { Paths } from '../../config/paths.js';
import { WorkspaceData } from '../../models/workspace.js';

interface WorkflowManagerProps {
  workspace: WorkspaceData; // Changed from workspaceId to workspace
  onClose: () => void;
}

interface WorkflowDetails {
  id: string;
  name: string;
  description?: string;
  nodes: number;
  connections: number;
  exists: boolean;
  filePath?: string;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  workspace,
  onClose,
}) => {
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails[]>([]);
  const [allWorkflows, setAllWorkflows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadWorkflowDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);

  const loadAllAvailableWorkflows = (): string[] => {
    const flowsDir = Paths.getWorkflowsDir();
    
    if (!fs.existsSync(flowsDir)) {
      fs.mkdirSync(flowsDir, { recursive: true });
      return [];
    }

    try {
      return fs.readdirSync(flowsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (err) {
      console.error('Failed to read flows directory:', err);
      return [];
    }
  };

  const loadWorkflowDetailsFromRefs = async (
    workflowRefs: Array<{ id: string; name: string; description?: string }>
  ): Promise<WorkflowDetails[]> => {
    const flowsDir = Paths.getWorkflowsDir();
    const details: WorkflowDetails[] = [];

    for (const ref of workflowRefs) {
      try {
        const flowPath = path.join(flowsDir, `${ref.id}.json`);

        if (fs.existsSync(flowPath)) {
          const content = fs.readFileSync(flowPath, 'utf-8');
          const workflow = JSON.parse(content);

          details.push({
            id: ref.id,
            name: ref.name,
            description: ref.description,
            nodes: workflow.canvasState?.nodes?.length ?? workflow.nodes?.length ?? 0,
            connections: workflow.canvasState?.connections?.length ?? workflow.connections?.length ?? 0,
            exists: true,
            filePath: flowPath,
          });
        } else {
          // Workflow referenced but file doesn't exist
          details.push({
            id: ref.id,
            name: ref.name,
            description: ref.description,
            nodes: 0,
            connections: 0,
            exists: false,
            filePath: flowPath,
          });
        }
      } catch (err) {
        console.error(`Failed to load workflow ${ref.id}:`, err);
        details.push({
          id: ref.id,
          name: ref.name,
          description: ref.description,
          nodes: 0,
          connections: 0,
          exists: false,
        });
      }
    }

    return details;
  };

  const loadWorkflowDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const details = await loadWorkflowDetailsFromRefs(workspace.workflows ?? []);
      setWorkflowDetails(details);

      const available = loadAllAvailableWorkflows();
      setAllWorkflows(available);
    } catch (err: any) {
      setError(err?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useInput((_, key) => {
    if (key.escape) onClose();
  });

  if (loading) {
    return (
      <Box>
        <Text color="#f4c430">
          <Spinner type="dots" />
        </Text>
        <Text color="#888888"> Loading workflows...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingX={2}>
        <Box marginBottom={1}>
          <Text bold color="#ef4444">
            Error Loading Workflows
          </Text>
        </Box>
        <Box borderStyle="round" borderColor="#ef4444" padding={1}>
          <Text color="#ef4444">{error}</Text>
        </Box>
        <Box marginTop={2}>
          <Text color="#888888">ESC: Close</Text>
        </Box>
      </Box>
    );
  }

  const existingWorkflows = workflowDetails.filter(w => w.exists);
  const missingWorkflows = workflowDetails.filter(w => !w.exists);
  const referencedIds = new Set(workflowDetails.map(w => w.id));
  const unreferencedWorkflows = allWorkflows.filter(id => !referencedIds.has(id));

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={1}>
        <Text bold color="#f4c430">
          Tools & AI Workflows
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="#888888">
          Referenced: {workflowDetails.length} ({existingWorkflows.length} available, {missingWorkflows.length} missing)
        </Text>
      </Box>

      {workflowDetails.length === 0 ? (
        <Box
          borderStyle="round"
          borderColor="#3a3a3a"
          padding={1}
          flexDirection="column"
        >
          <Text color="#888888">No workflows referenced in this workspace yet.</Text>
          <Box marginTop={1}>
            <Text color="#fbbf24">
              Create and export workflows from the Studio application.
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">
              Workflows directory: {Paths.getWorkflowsDir()}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box
          borderStyle="round"
          borderColor="#3a3a3a"
          padding={1}
          flexDirection="column"
        >
          {/* Existing Workflows */}
          {existingWorkflows.length > 0 && (
            <>
              <Box marginBottom={1}>
                <Text bold color="#4ade80">✓ Available Workflows:</Text>
              </Box>
              {existingWorkflows.map((wf, i) => (
                <Box
                  key={wf.id}
                  marginBottom={1}
                  flexDirection="column"
                  marginLeft={2}
                >
                  <Box>
                    <Text color="#60a5fa">{i + 1}. </Text>
                    <Text bold color="#e0e0e0">
                      {wf.name}
                    </Text>
                    <Text color="#4ade80"> ✓</Text>
                  </Box>

                  {wf.description && (
                    <Box marginLeft={3}>
                      <Text color="#888888">{wf.description}</Text>
                    </Box>
                  )}

                  <Box marginLeft={3}>
                    <Text color="#888888">
                      ID: {wf.id}
                    </Text>
                  </Box>

                  <Box marginLeft={3}>
                    <Text color="#888888">
                      Nodes: {wf.nodes} | Connections: {wf.connections}
                    </Text>
                  </Box>

                  <Box marginLeft={3}>
                    <Text color="#3a3a3a">
                      File: {wf.filePath}
                    </Text>
                  </Box>
                </Box>
              ))}
            </>
          )}

          {/* Missing Workflows */}
          {missingWorkflows.length > 0 && (
            <>
              <Box marginTop={existingWorkflows.length > 0 ? 2 : 0} marginBottom={1}>
                <Text bold color="#fbbf24">⚠ Missing Workflow Files:</Text>
              </Box>
              {missingWorkflows.map((wf, i) => (
                <Box
                  key={wf.id}
                  marginBottom={1}
                  flexDirection="column"
                  marginLeft={2}
                >
                  <Box>
                    <Text color="#fbbf24">{i + 1}. </Text>
                    <Text bold color="#e0e0e0">
                      {wf.name}
                    </Text>
                    <Text color="#fbbf24"> ⚠</Text>
                  </Box>

                  <Box marginLeft={3}>
                    <Text color="#888888">
                      ID: {wf.id}
                    </Text>
                  </Box>

                  <Box marginLeft={3}>
                    <Text color="#ef4444">
                      Expected: {wf.filePath}
                    </Text>
                  </Box>

                  <Box marginLeft={3}>
                    <Text color="#fbbf24">
                      This workflow is referenced in the workspace but the file doesn't exist
                    </Text>
                  </Box>
                </Box>
              ))}
            </>
          )}
        </Box>
      )}

      {/* Available but unreferenced workflows */}
      {unreferencedWorkflows.length > 0 && (
        <Box marginTop={2} borderStyle="round" borderColor="#60a5fa" padding={1}>
          <Box flexDirection="column">
            <Box marginBottom={1}>
              <Text bold color="#60a5fa">
                ℹ Available Workflows (Not Referenced)
              </Text>
            </Box>
            <Text color="#888888">
              These workflow files exist in the flows directory but aren't referenced in this workspace:
            </Text>
            <Box marginTop={1} marginLeft={2}>
              {unreferencedWorkflows.slice(0, 10).map((id, i) => (
                <Box key={id}>
                  <Text color="#888888">• {id}.json</Text>
                </Box>
              ))}
              {unreferencedWorkflows.length > 10 && (
                <Text color="#888888">
                  ... and {unreferencedWorkflows.length - 10} more
                </Text>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Help Section */}
      {missingWorkflows.length > 0 && (
        <Box marginTop={2} borderStyle="round" borderColor="#fbbf24" padding={1}>
          <Box flexDirection="column">
            <Text bold color="#fbbf24">⚠ Action Required:</Text>
            <Box marginTop={1}>
              <Text color="#e0e0e0">
                To fix missing workflows:
              </Text>
            </Box>
            <Box marginLeft={2} marginTop={1}>
              <Text color="#888888">
                1. Export the missing workflows from Studio
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text color="#888888">
                2. Place them in: {Paths.getWorkflowsDir()}
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text color="#888888">
                3. Ensure filenames match: workflow-id.json
              </Text>
            </Box>
            <Box marginTop={1}>
              <Text color="#e0e0e0">
                Or update the workspace to reference existing workflows.
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      <Box marginTop={2}>
        <Text color="#888888">
          Flows directory: {Paths.getWorkflowsDir()} ({allWorkflows.length} total files)
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="#888888">ESC: Close</Text>
      </Box>
    </Box>
  );
};