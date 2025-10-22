# Polkadot Todo App Workshop

A comprehensive workshop demonstrating how to build a decentralized todo application on Polkadot using Ink! smart contracts and React frontend.

## 🎯 Workshop Overview

This workshop teaches participants how to:
- Build smart contracts using Ink! (Rust-based smart contract framework for Substrate)
- Create a React frontend that interacts with Polkadot/Substrate networks
- Deploy and interact with smart contracts on a local Substrate node
- Understand the fundamentals of blockchain development on Polkadot

## 📁 Project Structure

### Smart Contract (`/contracts/`)
The Rust-based smart contract written in Ink! that handles the todo functionality.

**Key Files:**
- `lib.rs` - Main smart contract implementation
- `cargo.toml` - Rust dependencies and configuration
- `target/` - Compiled contract artifacts

**Contract Features:**
- **Add Todo**: Create new todo items with content
- **Toggle Todo**: Mark todos as completed/incomplete
- **Get Todo**: Retrieve individual todo items
- **Get Counter**: Get the total number of todos for an account

**Smart Contract Architecture:**
```rust
// Todo structure
struct Todo {
    id: u64,
    content: String,
    completed: bool,
}

// Main contract storage
struct TodoApp {
    todos: Mapping<(AccountId, u64), Todo>,  // User-specific todos
    counter: Mapping<AccountId, u64>,         // Todo counter per user
}
```

### Frontend Application (`/src/`)
React-based web application that provides a user interface for interacting with the smart contract.

**Key Components:**
- `App.js` - Main application component with contract interaction logic
- `App.css` - Styling for the todo application
- `index.js` - Application entry point

**Frontend Features:**
- Connect to local Substrate node (ws://localhost:9944)
- Create test accounts using Polkadot keyring
- Add new todos to the blockchain
- Toggle todo completion status
- View all todos for the current account
- Real-time updates when transactions are confirmed

### Configuration Files

**Package Management:**
- `package.json` - Node.js dependencies and scripts
- `package-lock.json` / `yarn.lock` - Dependency lock files

**Contract Metadata:**
- `public/todo_app.json` - Contract ABI and metadata for frontend interaction

**Build Artifacts:**
- `contracts/target/` - Compiled Rust contracts and WASM binaries
- `contracts/target/ink/` - Ink! specific build outputs

## 🛠 Technology Stack

### Smart Contract Layer
- **Ink! 6.0.0-alpha** - Rust-based smart contract framework
- **Substrate** - Blockchain framework
- **Rust** - Programming language for smart contracts
- **WASM** - WebAssembly for contract execution

### Frontend Layer
- **React 19.2.0** - Frontend framework
- **@polkadot/api** - Polkadot JavaScript API
- **@polkadot/api-contract** - Contract interaction utilities
- **@polkadot/keyring** - Account management
- **@polkadot/extension-dapp** - Browser extension integration

### Development Tools
- **Cargo** - Rust package manager
- **npm/yarn** - Node.js package managers
- **React Scripts** - Development and build tools

## 🚀 Getting Started

### Prerequisites
- Rust toolchain (latest stable)
- Node.js (v16 or higher)
- npm or yarn
- Substrate node with contracts pallet enabled

### Smart Contract Development

1. **Navigate to contracts directory:**
   ```bash
   cd contracts
   ```

2. **Build the contract:**
   ```bash
   cargo contract build
   ```

3. **Deploy the contract:**
   ```bash
   pop up --constructor new --suri //Alice
   ```

### Frontend Development

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

3. **Access the application:**
   - Open http://localhost:3100 in your browser
   - The app will automatically connect to your local Substrate node

## 📚 Workshop Learning Objectives

### Smart Contract Concepts
- **Storage Management**: Learn how to use Ink! storage primitives (Mapping, etc.)
- **Account Management**: Understand how to handle user accounts and permissions
- **State Management**: Implement persistent storage on the blockchain
- **Error Handling**: Proper error handling in smart contracts

### Frontend Integration
- **API Connection**: Connect to Substrate nodes using Polkadot.js API
- **Account Management**: Create and manage user accounts
- **Contract Interaction**: Call smart contract methods from the frontend
- **Transaction Handling**: Sign and send transactions to the blockchain
- **Real-time Updates**: Handle transaction confirmations and state updates

### Blockchain Concepts
- **Decentralized Storage**: How data is stored on the blockchain
- **Transaction Lifecycle**: From creation to finalization
- **Gas Fees**: Understanding transaction costs
- **Account Isolation**: How different users' data is separated

## 🔧 Development Workflow

### Smart Contract Development
1. Write contract logic in `lib.rs`
2. Test with `cargo test`
3. Build with `cargo contract build`
4. Deploy to local node
5. Update contract address in frontend

### Frontend Development
1. Modify React components in `/src/`
2. Update contract metadata if needed
3. Test with local Substrate node
4. Deploy to production

## 🎓 Workshop Exercises

### Beginner Level
1. **Deploy the Contract**: Deploy the todo contract to a local node
2. **Connect Frontend**: Get the frontend connected to your node
3. **Add Todos**: Create your first todo items
4. **Toggle Completion**: Mark todos as complete

### Intermediate Level
1. **Modify Contract**: Add new features like todo deletion
2. **Enhance Frontend**: Improve the UI/UX
3. **Error Handling**: Implement proper error handling
4. **Testing**: Write unit tests for contract functions

### Advanced Level
1. **Advanced Features**: Add categories, due dates, etc.
2. **Optimization**: Optimize gas usage and storage
3. **Deployment**: Deploy to testnet/mainnet

## 🔍 Key Code Examples

### Smart Contract - Adding a Todo
```rust
#[ink(message)]
pub fn add_todo(&mut self, content: String) {
    let caller = self.env().caller();
    let id = self.counter.get(&caller).unwrap_or_default();
    
    let todo = Todo {
        id,
        content,
        completed: false,
    };
    
    self.todos.insert((&caller, id), &todo);
    self.counter.insert(&caller, &(id + 1));
}
```

### Frontend - Contract Interaction
```javascript
const addTodo = async () => {
  const contract = new ContractPromise(api, contractMetadata, contractAddress);
  const tx = contract.tx.addTodo({}, newTodo.trim());
  
  await tx.signAndSend(account, (result) => {
    if (result.status.isFinalized) {
      console.log('Todo added successfully!');
      loadTodos(); // Refresh the list
    }
  });
};
```

## 🐛 Troubleshooting

### Common Issues
1. **Connection Failed**: Ensure Substrate node is running on ws://localhost:9944
2. **Contract Not Found**: Verify contract is deployed and address is correct
3. **Transaction Failed**: Check account has sufficient balance
4. **Build Errors**: Ensure all dependencies are installed

### Debug Tips
- Check browser console for detailed error messages
- Use Polkadot.js Apps to inspect your local node
- Verify contract deployment with `cargo contract info`

## 📖 Additional Resources

- [Ink! Documentation](https://use.ink/)
- [Polkadot.js API Documentation](https://polkadot.js.org/docs/api/)
- [Substrate Documentation](https://docs.substrate.io/)
- [Polkadot Network](https://polkadot.network/)

## 🤝 Contributing

This is a workshop project designed for educational purposes. Feel free to:
- Fork the repository
- Add new features
- Improve documentation
- Submit pull requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Building! 🚀**

This workshop provides a solid foundation for understanding blockchain development on Polkadot. Start with the basics and gradually work your way up to more complex features!