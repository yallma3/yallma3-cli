import React, { useState } from 'react';
import { Box, Text, useInput, Newline } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { Task, WorkspaceData } from '../../models/workspace.js';

interface TaskManagerProps {
	workspace: WorkspaceData;
	onUpdate: (workspace: WorkspaceData) => void;
	onClose: () => void;
}

type Step =
	| 'list'
	| 'create-title'
	| 'create-desc'
	| 'create-output'
	| 'create-type'
	| 'graph'
	| 'detail';

export const TaskManager: React.FC<TaskManagerProps> = ({
	workspace,
	onUpdate,
	onClose
}) => {
	const [step, setStep] = useState<Step>('list');
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);

	const [newTask, setNewTask] = useState({
		title: '',
		description: '',
		expectedOutput: '',
		type: 'agentic'
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
			{ label: '+ Create New Task', value: 'create' },
			{ label: '# View Task Graph', value: 'graph' },
			...workspace.tasks.map(task => ({
				label: `${task.title} [${task.type}]`,
				value: task.id
			}))
		];

		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text bold color="#f4c430">
						Task Management
					</Text>
				</Box>

				<Box marginBottom={1}>
					<Text color="#888888">
						Total: {workspace.tasks.length} tasks | Connections:{' '}
						{workspace.connections.length}
					</Text>
				</Box>

				<SelectInput
					items={items}
					onSelect={(item: any) => {
						if (item.value === 'create') {
							setStep('create-title');
						} else if (item.value === 'graph') {
							setStep('graph');
						} else {
							const task = workspace.tasks.find(t => t.id === item.value);
							if (task) {
								setSelectedTask(task);
								setStep('detail');
							}
						}
					}}
				/>

				<Box marginTop={2}>
					<Text color="#888888">
						ESC: Close | Up/Down: Navigate | Enter: Select
					</Text>
				</Box>
			</Box>
		);
	};

	const renderCreateTitle = () => (
		<Box flexDirection="column">
			<Text bold color="#f4c430">
				Create New Task
			</Text>
			<Newline />

			<Box>
				<Text color="#fbbf24">Task Title: </Text>
				<TextInput
					value={newTask.title}
					onChange={(value: string) => setNewTask({ ...newTask, title: value })}
					onSubmit={() => {
						if (newTask.title.trim()) setStep('create-desc');
					}}
				/>
			</Box>

			<Box marginTop={1}>
				<Text color="#888888">Enter: Next | ESC: Cancel</Text>
			</Box>
		</Box>
	);

	const renderCreateDesc = () => (
		<Box flexDirection="column">
			<Text bold color="#f4c430">
				Create New Task
			</Text>
			<Newline />

			<Box marginBottom={1}>
				<Text color="#4ade80">√ Title: </Text>
				<Text bold color="#e0e0e0">
					{newTask.title}
				</Text>
			</Box>

			<Box>
				<Text color="#fbbf24">Description: </Text>
				<TextInput
					value={newTask.description}
					onChange={(value: string) =>
						setNewTask({ ...newTask, description: value })
					}
					onSubmit={() => setStep('create-output')}
					placeholder="Optional, press Enter to skip"
				/>
			</Box>

			<Box marginTop={1}>
				<Text color="#888888">Enter: Next | ESC: Back</Text>
			</Box>
		</Box>
	);

	const renderCreateOutput = () => (
		<Box flexDirection="column">
			<Text bold color="#f4c430">
				Create New Task
			</Text>
			<Newline />

			<Box marginBottom={1}>
				<Text color="#4ade80">√ Title: </Text>
				<Text bold color="#e0e0e0">
					{newTask.title}
				</Text>
			</Box>

			<Box>
				<Text color="#fbbf24">Expected Output: </Text>
				<TextInput
					value={newTask.expectedOutput}
					onChange={(value: string) =>
						setNewTask({ ...newTask, expectedOutput: value })
					}
					onSubmit={() => setStep('create-type')}
					placeholder="Optional, press Enter to skip"
				/>
			</Box>

			<Box marginTop={1}>
				<Text color="#888888">Enter: Next | ESC: Back</Text>
			</Box>
		</Box>
	);

	const handleCreateTask = () => {
		const taskId = `tk-${Date.now()}${Math.random().toString(36).substr(2, 3)}`;
		const socketBase = (workspace.tasks.length + 1) * 100;

		const task: Task = {
			id: taskId,
			title: newTask.title,
			description: newTask.description,
			expectedOutput: newTask.expectedOutput,
			type: newTask.type as any,
			executorId: null,
			position: {
				x: socketBase * 5,
				y: Math.floor(Math.random() * 201) - 100
			},
			selected: false,
			sockets: [
				{ id: socketBase + 1, title: 'Input', type: 'input' },
				{ id: socketBase + 2, title: 'Output', type: 'output' }
			]
		};

		const updatedWorkspace: WorkspaceData = {
			...workspace,
			tasks: [...workspace.tasks, task],
			updatedAt: Date.now()
		};

		onUpdate(updatedWorkspace);

		setNewTask({
			title: '',
			description: '',
			expectedOutput: '',
			type: 'agentic'
		});

		setStep('list');
	};

	const renderCreateType = () => {
		const items = [
			{ label: 'Agentic (Auto-select agent)', value: 'agentic' },
			{ label: 'Specific Agent', value: 'specific-agent' },
			{ label: 'Workflow', value: 'workflow' }
		];

		return (
			<Box flexDirection="column">
				<Text bold color="#f4c430">
					Create New Task
				</Text>
				<Newline />

				<Box marginBottom={1}>
					<Text color="#4ade80">√ Title: </Text>
					<Text bold color="#e0e0e0">
						{newTask.title}
					</Text>
				</Box>

				<Box marginBottom={2}>
					<Text color="#fbbf24">Task Type:</Text>
				</Box>

				<SelectInput
					items={items}
					onSelect={(item: any) => {
						setNewTask({ ...newTask, type: item.value });
						handleCreateTask();
					}}
				/>

				<Box marginTop={1}>
					<Text color="#888888">ESC: Back</Text>
				</Box>
			</Box>
		);
	};

	const renderGraph = () => (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text bold color="#f4c430">
					# Task Dependency Graph
				</Text>
			</Box>

			<Box
				borderStyle="round"
				borderColor="#3a3a3a"
				padding={1}
				flexDirection="column"
			>
				{workspace.tasks.length === 0 ? (
					<Text color="#888888">No tasks to display</Text>
				) : (
					workspace.tasks.map((task, i) => {
						const connections = workspace.connections.filter(c =>
							task.sockets.some(
								s => s.id === c.fromSocket || s.id === c.toSocket
							)
						);

						return (
							<Box key={task.id} marginBottom={0}>
								<Text color="#fbbf24">{'| '.repeat(i)} </Text>
								<Text bold color="#e0e0e0">
									{task.title}
								</Text>
								<Text color="#888888"> [{task.type}]</Text>
								{connections.length > 0 && (
                <Text color="#888888">
                  {' '}-{'>'} {connections.length} connections
                </Text>
								)}
							</Box>
						);
					})
				)}
			</Box>

			<Box marginTop={2}>
				<Text color="#888888">ESC: Back</Text>
			</Box>
		</Box>
	);

	const renderDetail = () => {
		if (!selectedTask) return null;

		const connections = workspace.connections.filter(c =>
			selectedTask.sockets.some(s => s.id === c.fromSocket || s.id === c.toSocket)
		);

		return (
			<Box flexDirection="column">
				<Box marginBottom={1}>
					<Text bold color="#f4c430">
						{selectedTask.title}
					</Text>
				</Box>

				<Box
					borderStyle="round"
					borderColor="#3a3a3a"
					padding={1}
					flexDirection="column"
				>
					<Box>
						<Text color="#888888">ID: </Text>
						<Text color="#e0e0e0">{selectedTask.id}</Text>
					</Box>

					<Box marginTop={1}>
						<Text color="#888888">Type: </Text>
						<Text color="#60a5fa">{selectedTask.type}</Text>
					</Box>

					{selectedTask.description && (
						<Box marginTop={1} flexDirection="column">
							<Text color="#888888">Description:</Text>
							<Text color="#e0e0e0">{selectedTask.description}</Text>
						</Box>
					)}

					{selectedTask.expectedOutput && (
						<Box marginTop={1} flexDirection="column">
							<Text color="#888888">Expected Output:</Text>
							<Text color="#e0e0e0">{selectedTask.expectedOutput}</Text>
						</Box>
					)}

					<Box marginTop={1}>
						<Text color="#888888">Connections: </Text>
						<Text bold color="#fbbf24">
							{connections.length}
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
			case 'create-title':
				return renderCreateTitle();
			case 'create-desc':
				return renderCreateDesc();
			case 'create-output':
				return renderCreateOutput();
			case 'create-type':
				return renderCreateType();
			case 'graph':
				return renderGraph();
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
