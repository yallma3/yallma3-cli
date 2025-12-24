import React, { useState } from 'react';
import { Box, Text, useInput, Newline } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { EnvironmentVariable, WorkspaceData } from '../../models/workspace.js';

interface EnvManagerProps {
	workspace: WorkspaceData;
	onUpdate: (workspace: WorkspaceData) => void;
	onClose: () => void;
}

type Step = 'list' | 'create-key' | 'create-value' | 'detail';

export const EnvManager: React.FC<EnvManagerProps> = ({
	workspace,
	onUpdate,
	onClose
}) => {
	const [step, setStep] = useState<Step>('list');
	const [selectedVar, setSelectedVar] = useState<EnvironmentVariable | null>(null);

	const [newVar, setNewVar] = useState({
		key: '',
		value: '',
		sensitive: true
	});

	useInput((input, key) => {
		if (key.escape) {
			if (step === 'list') onClose();
			else setStep('list');
		}

		if (step === 'create-value' && input === 't') {
			setNewVar(prev => ({ ...prev, sensitive: !prev.sensitive }));
		}
	});

	const renderList = () => {
		const vars = workspace.environmentVariables || [];

		const items = [
			{ label: '+ Set New Variable', value: 'create' },
			...vars.map(v => ({
				label: `${v.key} ${v.sensitive ? '[Sensitive]' : ''}`,
				value: v.id
			}))
		];

		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text bold color="#f4c430">
						Environment Variables
					</Text>
				</Box>

				<Box marginBottom={1}>
					<Text color="#888888">Total: {vars.length} variables</Text>
				</Box>

				{vars.length === 0 ? (
					<Box marginBottom={2} padding={1} borderStyle="round" borderColor="#3a3a3a">
						<Text color="#888888">
							No environment variables yet. Create one to get started.
						</Text>
					</Box>
				) : (
					<SelectInput
						items={items}
						onSelect={(item: any) => {
							if (item.value === 'create') {
								setStep('create-key');
							} else {
								const envVar = vars.find(v => v.id === item.value);
								if (envVar) {
									setSelectedVar(envVar);
									setStep('detail');
								}
							}
						}}
					/>
				)}

				{vars.length === 0 && (
					<Box marginTop={1}>
						<Text color="#fbbf24">Press Enter to create your first variable</Text>
					</Box>
				)}

				<Box marginTop={2}>
					<Text color="#888888">ESC: Close | Up/Down: Navigate | Enter: Select</Text>
				</Box>
			</Box>
		);
	};

	const renderCreateKey = () => (
		<Box flexDirection="column">
			<Text bold color="#f4c430">
				Set Environment Variable
			</Text>
			<Newline />

			<Box>
				<Text color="#fbbf24">Variable Key (UPPERCASE_WITH_UNDERSCORES): </Text>
				<TextInput
					value={newVar.key}
					onChange={(value: string) =>
						setNewVar({ ...newVar, key: value.toUpperCase() })
					}
					onSubmit={() => {
						if (newVar.key.trim() && /^[A-Z_][A-Z0-9_]*$/.test(newVar.key)) {
							setStep('create-value');
						}
					}}
				/>
			</Box>

			<Box marginTop={1}>
				<Text color="#888888">Enter: Next | ESC: Cancel</Text>
			</Box>
		</Box>
	);

	const handleCreateVar = () => {
		if (!newVar.key.trim() || !newVar.value.trim()) return;

		const now = Date.now();
		const envVar: EnvironmentVariable = {
			id: `env-${now}`,
			key: newVar.key,
			value: newVar.value,
			sensitive: newVar.sensitive,
			createdAt: now,
			updatedAt: now
		};

		const existing = workspace.environmentVariables || [];
		const existingIndex = existing.findIndex(v => v.key === newVar.key);

		const updatedEnvironmentVariables =
			existingIndex >= 0
				? existing.map((v, i) => (i === existingIndex ? envVar : v))
				: [...existing, envVar];

		const updatedWorkspace: WorkspaceData = {
			...workspace,
			environmentVariables: updatedEnvironmentVariables,
			updatedAt: Date.now()
		};

		onUpdate(updatedWorkspace);

		setNewVar({ key: '', value: '', sensitive: true });
		setStep('list');
	};

	const renderCreateValue = () => (
		<Box flexDirection="column">
			<Text bold color="#f4c430">
				Set Environment Variable
			</Text>
			<Newline />

			<Box marginBottom={1}>
				<Text color="#4ade80">v Key: </Text>
				<Text bold color="#e0e0e0">
					{newVar.key}
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text color="#fbbf24">Is this sensitive (API key, password)? </Text>
				<Text color="#e0e0e0">{newVar.sensitive ? 'Yes' : 'No'}</Text>
				<Text color="#888888"> (press 't' to toggle)</Text>
			</Box>

			<Box>
				<Text color="#fbbf24">Value: </Text>
				<TextInput
					value={newVar.value}
					onChange={(value: string) => setNewVar({ ...newVar, value })}
					onSubmit={handleCreateVar}
					mask={newVar.sensitive ? '*' : undefined}
				/>
			</Box>

			<Box marginTop={1}>
				<Text color="#888888">Enter: Save | ESC: Back | t: Toggle Sensitive</Text>
			</Box>
		</Box>
	);

	const renderDetail = () => {
		if (!selectedVar) return null;

		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text bold color="#f4c430">
						{selectedVar.key}
					</Text>
				</Box>

				<Box borderStyle="round" borderColor="#3a3a3a" padding={1} flexDirection="column">
					<Box>
						<Text color="#888888">Key: </Text>
						<Text color="#e0e0e0">{selectedVar.key}</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="#888888">Value: </Text>
						<Text color={selectedVar.sensitive ? '#fbbf24' : '#e0e0e0'}>
							{selectedVar.sensitive ? '********' : selectedVar.value}
						</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="#888888">Sensitive: </Text>
						<Text color="#e0e0e0">{selectedVar.sensitive ? 'Yes' : 'No'}</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="#888888">Created: </Text>
						<Text color="#888888">
							{new Date(selectedVar.createdAt).toLocaleString()}
						</Text>
					</Box>

					<Box>
						<Text color="#888888">Updated: </Text>
						<Text color="#888888">
							{new Date(selectedVar.updatedAt).toLocaleString()}
						</Text>
					</Box>
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
			case 'create-key':
				return renderCreateKey();
			case 'create-value':
				return renderCreateValue();
			case 'detail':
				return renderDetail();
			default:
				return renderList();
		}
	};

	return (
		<Box flexDirection="column" padding={1}>
			{renderStep()}
		</Box>
	);
};
