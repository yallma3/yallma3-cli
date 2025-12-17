// src/tui/components/agent-manager.tsx - REPLACE THIS FILE
import React, { useState } from 'react';
import { Box, Text, useInput, Newline } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { Agent, WorkspaceData } from '../../models/workspace.js';
import { getProviders, getModelsForProvider } from '../../models/llm.js';

interface AgentManagerProps {
  workspace: WorkspaceData;
  onUpdate: (workspace: WorkspaceData) => void;
  onClose: () => void;
}

type Step = 'list' | 'create-name' | 'create-role' | 'create-background' | 'create-llm-provider' | 'create-llm-model' | 'detail';

export const AgentManager: React.FC<AgentManagerProps> = ({ workspace, onUpdate, onClose }) => {
  const [step, setStep] = useState<Step>('list');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const [newAgent, setNewAgent] = useState({
    name: '',
    role: '',
    background: '',
    provider: 'Groq',
    model: '',
  });

  useInput((input, key) => {
    if (key.escape) {
      if (step === 'list') {
        onClose();
      } else {
        setStep('list');
      }
    }
  });

  const renderList = () => {
    const items = [
      { label: '+ Create New Agent', value: 'create' },
      ...workspace.agents.map(agent => ({
        label: `${agent.name}${agent.role ? ` - ${agent.role}` : ''} (${agent.tools.length} tools)`,
        value: agent.id,
      })),
    ];

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="#f4c430">Sub Agents ({workspace.agents.length})</Text>
        </Box>

        <SelectInput
          items={items}
          onSelect={(item) => {
            if (item.value === 'create') {
              setStep('create-name');
            } else {
              const agent = workspace.agents.find(a => a.id === item.value);
              if (agent) {
                setSelectedAgent(agent);
                setStep('detail');
              }
            }
          }}
        />

        <Box marginTop={1}>
          <Text color="#888888">ESC: Close | Up/Down: Navigate | Enter: Select</Text>
        </Box>
      </Box>
    );
  };

  const renderCreateName = () => (
    <Box flexDirection="column">
      <Text bold color="#f4c430">Create New Agent</Text>
      <Newline />
      
      <Box>
        <Text color="#fbbf24">Agent Name: </Text>
        <TextInput
          value={newAgent.name}
          onChange={(value) => setNewAgent({ ...newAgent, name: value })}
          onSubmit={() => {
            if (newAgent.name.trim()) {
              setStep('create-role');
            }
          }}
        />
      </Box>
      
      <Box marginTop={1}>
        <Text color="#888888">Enter: Next | ESC: Cancel</Text>
      </Box>
    </Box>
  );

  const renderCreateRole = () => (
    <Box flexDirection="column">
      <Text bold color="#f4c430">Create New Agent</Text>
      <Newline />
      
      <Box marginBottom={1}>
        <Text color="#4ade80">√ Name: </Text>
        <Text bold color="#e0e0e0">{newAgent.name}</Text>
      </Box>

      <Box>
        <Text color="#fbbf24">Role (e.g., Writer, Researcher): </Text>
        <TextInput
          value={newAgent.role}
          onChange={(value) => setNewAgent({ ...newAgent, role: value })}
          onSubmit={() => setStep('create-background')}
          placeholder="Optional, press Enter to skip"
        />
      </Box>
      
      <Box marginTop={1}>
        <Text color="#888888">Enter: Next | ESC: Back</Text>
      </Box>
    </Box>
  );

  const renderCreateBackground = () => (
    <Box flexDirection="column">
      <Text bold color="#f4c430">Create New Agent</Text>
      <Newline />
      
      <Box marginBottom={1}>
        <Text color="#4ade80">√ Name: </Text>
        <Text bold color="#e0e0e0">{newAgent.name}</Text>
      </Box>

      {newAgent.role && (
        <Box marginBottom={1}>
          <Text color="#4ade80">√ Role: </Text>
          <Text bold color="#e0e0e0">{newAgent.role}</Text>
        </Box>
      )}

      <Box>
        <Text color="#fbbf24">Background/Instructions: </Text>
        <TextInput
          value={newAgent.background}
          onChange={(value) => setNewAgent({ ...newAgent, background: value })}
          onSubmit={() => setStep('create-llm-provider')}
          placeholder="Optional, press Enter to skip"
        />
      </Box>
      
      <Box marginTop={1}>
        <Text color="#888888">Enter: Next | ESC: Back</Text>
      </Box>
    </Box>
  );

  const renderCreateLLMProvider = () => {
    const providers = getProviders();
    const items = providers.map(p => ({ label: p, value: p }));

    return (
      <Box flexDirection="column">
        <Text bold color="#f4c430">Create New Agent</Text>
        <Newline />
        
        <Box marginBottom={1}>
          <Text color="#4ade80">√ Name: </Text>
          <Text bold color="#e0e0e0">{newAgent.name}</Text>
        </Box>

        <Box marginBottom={2}>
          <Text color="#fbbf24">Select LLM Provider:</Text>
        </Box>

        <SelectInput
          items={[
            { label: 'Use Workspace Default', value: 'default' },
            ...items
          ]}
          onSelect={(item) => {
            if (item.value === 'default') {
              handleCreateAgent();
            } else {
              setNewAgent({ ...newAgent, provider: item.value });
              setStep('create-llm-model');
            }
          }}
        />
        
        <Box marginTop={1}>
          <Text color="#888888">ESC: Back</Text>
        </Box>
      </Box>
    );
  };

  const renderCreateLLMModel = () => {
    const models = getModelsForProvider(newAgent.provider);
    const items = models.map(m => ({
      label: `${m.name} (${m.id})`,
      value: m.id,
    }));

    return (
      <Box flexDirection="column">
        <Text bold color="#f4c430">Create New Agent</Text>
        <Newline />
        
        <Box marginBottom={1}>
          <Text color="#4ade80">√ Provider: </Text>
          <Text bold color="#e0e0e0">{newAgent.provider}</Text>
        </Box>

        <Box marginBottom={2}>
          <Text color="#fbbf24">Select Model:</Text>
        </Box>

        <SelectInput
          items={items}
          onSelect={(item) => {
            setNewAgent({ ...newAgent, model: item.value });
            handleCreateAgent();
          }}
        />
        
        <Box marginTop={1}>
          <Text color="#888888">ESC: Back</Text>
        </Box>
      </Box>
    );
  };

  const handleCreateAgent = () => {
    const models = getModelsForProvider(newAgent.provider);
    const selectedModel = models.find(m => m.id === newAgent.model);

    const agent: Agent = {
      id: `ag-${Date.now()}${Math.random().toString(36).substr(2, 3)}`,
      name: newAgent.name,
      role: newAgent.role || undefined,
      background: newAgent.background || undefined,
      tools: [],
      llm: selectedModel ? {
        provider: newAgent.provider,
        model: selectedModel,
      } : workspace.mainLLM,
      apiKey: workspace.apiKey,
    };

    const updated = { ...workspace };
    updated.agents.push(agent);
    updated.updatedAt = Date.now();
    
    onUpdate(updated);

    setNewAgent({
      name: '',
      role: '',
      background: '',
      provider: 'Groq',
      model: '',
    });

    setStep('list');
  };

  const renderDetail = () => {
    if (!selectedAgent) return null;

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="#f4c430">{selectedAgent.name}</Text>
        </Box>

        <Box borderStyle="round" borderColor="#3a3a3a" padding={1} flexDirection="column">
          <Box>
            <Text color="#888888">ID: </Text>
            <Text color="#e0e0e0">{selectedAgent.id}</Text>
          </Box>

          {selectedAgent.role && (
            <Box marginTop={1}>
              <Text color="#888888">Role: </Text>
              <Text color="#e0e0e0">{selectedAgent.role}</Text>
            </Box>
          )}

          {selectedAgent.background && (
            <Box marginTop={1} flexDirection="column">
              <Text color="#888888">Background:</Text>
              <Text color="#e0e0e0">{selectedAgent.background}</Text>
            </Box>
          )}

          <Box marginTop={1}>
            <Text color="#888888">LLM: </Text>
            <Text color="#60a5fa">{selectedAgent.llm.provider}</Text>
            <Text color="#e0e0e0"> - {selectedAgent.llm.model.name}</Text>
          </Box>

          <Box>
            <Text color="#888888">Tools: </Text>
            <Text bold color="#fbbf24">{selectedAgent.tools.length}</Text>
          </Box>

          {selectedAgent.tools.length > 0 && (
            <Box marginTop={1} flexDirection="column">
              <Text bold color="#888888">Tools:</Text>
              {selectedAgent.tools.map((tool, i) => (
                <Box key={i}>
                  <Text color="#888888">  * {tool.name}</Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box marginTop={2}>
          <Text color="#888888">ESC: Back</Text>
        </Box>
      </Box>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'list':
        return renderList();
      case 'create-name':
        return renderCreateName();
      case 'create-role':
        return renderCreateRole();
      case 'create-background':
        return renderCreateBackground();
      case 'create-llm-provider':
        return renderCreateLLMProvider();
      case 'create-llm-model':
        return renderCreateLLMModel();
      case 'detail':
        return renderDetail();
      default:
        return renderList();
    }
  };

  return renderStep();
};