import React, { useState, useEffect, useCallback } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import './App.css';

function App() {

  const [api, setApi] = useState(null);
  const [account, setAccount] = useState(null);
  const [contractAddress] = useState('5EYiWfYtMRwn89pocCKUH5gQ8qbQ9NjjRAkNhSRFcAY2YhwN');
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);
  const [todoCounter, setTodoCounter] = useState(0);
  const [error, setError] = useState('');

  // Connect to Substrate node automatically
  const connectToNode = async () => {
    try {
      setLoading(true);

      console.log('Connecting to local Substrate node...');
      
      // Connect to local node (Pop CLI)
      const wsProvider = new WsProvider('ws://localhost:9944');
      const apiInstance = await ApiPromise.create({ provider: wsProvider });
      
      setApi(apiInstance);
      setError('');
      console.log('Connected to local Substrate node successfully!');
      
      // Get chain info
      const chain = await apiInstance.rpc.system.chain();
      const version = await apiInstance.rpc.system.version();
      console.log(`Connected to chain: ${chain} (${version})`);
      
      // Check what's available in the API
      console.log('Available API modules:', Object.keys(apiInstance));
      console.log('Available tx modules:', Object.keys(apiInstance.tx || {}));
      console.log('Contracts module available:', !!apiInstance.tx.contracts);
      if (apiInstance.tx.contracts) {
        console.log('Contract methods available:', Object.keys(apiInstance.tx.contracts));
      }
      
    } catch (error) {
      console.log(`Connection failed: ${error.message}`);
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestAccount = () => {
    const { Keyring } = require('@polkadot/keyring');
    const keyring = new Keyring({ type: 'sr25519' });
    const testAccount = keyring.addFromUri('//Alice');
    setAccount(testAccount);
    console.log(`Test account created: ${testAccount.address}`);
  };

  // Load contract metadata
  const loadContractMetadata = async () => {
    try {
      const response = await fetch('/todo_app.json');
      if (!response.ok) {
        throw new Error('Failed to load contract metadata');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading contract metadata:', error);
      return null;
    }
  };

  // Check if contracts are available
  const checkContractsSupport = useCallback(() => {
    if (!api) {
      console.log('API not connected');
      return false;
    }
    
    return !!(api.tx.contracts);
  }, [api]);

  const getTodoCounter = async () => {
    if (!api || !contractAddress || !account) {
      console.log('Please connect, create account, and ensure contract is deployed');
      return;
    }

    if (!checkContractsSupport()) {
      console.log('Contracts not supported on this network');
      setError('Contracts not supported on this network. Please ensure you are connected to a Substrate node with contracts pallet enabled.');
      return;
    }

    try {
      setLoading(true);
      console.log('Getting todo counter...');
      
      const contractMetadata = await loadContractMetadata();

      if (!contractMetadata) return;
      
      const contract = new ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );

      // Call the 'get_counter' method
      const result = await contract.query.getCounter(account.address, {}, account.address);
      
      if (result.result.isOk) {
        const counter = result.output.toHuman();
        setTodoCounter(parseInt(counter));
        setError('');
        console.log(`Todo counter: ${counter}`);
      } else {
        console.log(`Contract call failed: ${result.result.asErr}`);
        setError(`Contract call failed: ${result.result.asErr}`);
      }
      
    } catch (error) {
      console.log(`Failed to get counter: ${error.message}`);
      console.error('Get counter error:', error);
      setError(`Failed to get counter: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add a new todo
  const addTodo = async () => {
    if (!api || !contractAddress || !account || !newTodo.trim()) {
      console.log('Please connect, create account, and enter a todo');
      return;
    }

    if (!checkContractsSupport()) {
      console.log('Contracts not supported on this network');
      setError('Contracts not supported on this network. Please ensure you are connected to a Substrate node with contracts pallet enabled.');
      return;
    }

    try {
      setLoading(true);
      console.log(`Adding todo: ${newTodo}`);
      
      const contractMetadata = await loadContractMetadata();

      if (!contractMetadata) return;
      
      // Create contract instance
      const contract = new ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );
      
      const tx = contract.tx.addTodo({}, newTodo.trim());
      
      await tx.signAndSend(account, (result) => {
        if (result.status.isInBlock) {
          console.log(`Transaction included in block: ${result.status.asInBlock}`);
        }
        if (result.status.isFinalized) {
          console.log(`Transaction finalized: ${result.status.asFinalized}`);
          console.log(`✅ Todo added: ${newTodo}`);
          setNewTodo('');
          setError('');
          // Refresh the counter and load todos
          getTodoCounter();
          loadTodos();
        }
      });
      
    } catch (error) {
      console.log(`Add todo failed: ${error.message}`);
      console.error('Add todo error:', error);
      setError(`Add todo failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todoId) => {
    if (!api || !contractAddress || !account) {
      console.log('Please connect, create account, and ensure contract is deployed');
      return;
    }

    if (!checkContractsSupport()) {
      console.log('Contracts not supported on this network');
      setError('Contracts not supported on this network. Please ensure you are connected to a Substrate node with contracts pallet enabled.');
      return;
    }

    try {
      setLoading(true);
      console.log(`Toggling todo ${todoId}...`);
      
      const contractMetadata = await loadContractMetadata();
      if (!contractMetadata) return;
      
      // Create contract instance
      const contract = new ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );
      
      // Call the 'toggle_todo' method
      const tx = contract.tx.toggleTodo({}, todoId);
      
      await tx.signAndSend(account, (result) => {
        if (result.status.isInBlock) {
          console.log(`Transaction included in block: ${result.status.asInBlock}`);
        }
        if (result.status.isFinalized) {
          console.log(`Transaction finalized: ${result.status.asFinalized}`);
          console.log(`✅ Todo ${todoId} toggled`);
          // Refresh todos
          loadTodos();
        }
      });
      
    } catch (error) {
      console.log(`Toggle todo failed: ${error.message}`);
      console.error('Toggle todo error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all todos for current account
  const loadTodos = useCallback(async () => {
    if (!api || !contractAddress || !account) {
      return;
    }

    if (!checkContractsSupport()) {
      console.log('Contracts not supported on this network');
      setError('Contracts not supported on this network. Please ensure you are connected to a Substrate node with contracts pallet enabled.');
      return;
    }

    try {
      const contractMetadata = await loadContractMetadata();
      if (!contractMetadata) return;
      
      // Create contract instance
      const contract = new ContractPromise(
        api,
        contractMetadata,
        contractAddress
      );
      
      const todosList = [];
      
      // Load todos up to the counter
      for (let i = 0; i < todoCounter; i++) {
        try {
          const result = await contract.query.getTodo(account.address, {}, i);
          if (result.result.isOk) {
            const todo = result.output.toHuman();
            todosList.push({
              id: i,
              content: todo.content,
              completed: todo.completed
            });
          }
        } catch (error) {
          console.log(`Failed to load todo ${i}:`, error);
        }
      }
      
      setTodos(todosList);
      console.log(`Loaded ${todosList.length} todos`);
      
    } catch (error) {
      console.log(`Failed to load todos: ${error.message}`);
      console.error('Load todos error:', error);
    }
  }, [api, contractAddress, account, todoCounter, checkContractsSupport]);


  // Auto-connect and create account on mount
  useEffect(() => {
    const initializeApp = async () => {
      await connectToNode();
      createTestAccount();
    };
    initializeApp();
  }, []);

  // Load todos when account and counter change
  useEffect(() => {
    if (account && todoCounter > 0) {
      loadTodos();
    }
  }, [account, todoCounter, loadTodos]);

  return (
    <div className="App">
      <div className="todo-app">
        <h1 className="app-title">Todo List</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="add-todo-section">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-input"
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <button 
            onClick={addTodo} 
            disabled={loading || !account || !newTodo.trim()}
            className="add-button"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>

        <div className="todos-list">
          {todos.length === 0 ? (
            <div className="no-todos">
              {account ? 'No todos yet. Add one above!' : 'Loading...'}
            </div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <button 
                  onClick={() => toggleTodo(todo.id)} 
                  disabled={loading}
                  className="todo-toggle"
                >
                  {todo.completed ? '✓' : ''}
                </button>
                <span className="todo-text">{todo.content}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;