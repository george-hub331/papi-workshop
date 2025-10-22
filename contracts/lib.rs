#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod todo_app {
    use ink::prelude::string::String;
    use ink::storage::Mapping;
    use ink_primitives::AccountId as ink_AccountId;

    #[derive(Default, Clone, scale::Encode, scale::Decode, scale_info::TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Todo {
        pub id: u64,
        pub content: String,
        pub completed: bool,
    }

    #[ink(storage)]
    #[derive(Default)]
    pub struct TodoApp {
        todos: Mapping<(AccountId, u64), Todo>,
        counter: Mapping<AccountId, u64>,
    }

    impl TodoApp {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                todos: Mapping::default(),
                counter: Mapping::default(),
            }
        }

        #[ink(message)]
        pub fn add_todo(&mut self, content: String) {

            let caller_h160 = self.env().caller();

            let mut data = [0u8; 32];
            data[12..].copy_from_slice(caller_h160.as_bytes());
            let caller = AccountId::from(data);

            // ✅ use &caller, not caller
            let id = self.counter.get(&caller).unwrap_or_default();

            let todo = Todo {
                id,
                content,
                completed: false,
            };
            // ✅ use &caller for Mapping key
            self.todos.insert((&caller, id), &todo);

            let next_id = id.checked_add(1).unwrap_or(id + 1);
            self.counter.insert(&caller, &next_id);
        }

        #[ink(message)]
        pub fn toggle_todo(&mut self, id: u64) -> Option<bool> {
            let caller_h160 = self.env().caller();

            let mut data = [0u8; 32];
            data[12..].copy_from_slice(caller_h160.as_bytes());
            let caller = AccountId::from(data);

            // ✅ use &caller
            if let Some(mut todo) = self.todos.get((&caller, id)) {
                todo.completed = !todo.completed;
                self.todos.insert((&caller, id), &todo);
                Some(todo.completed)
            } else {
                None
            }
        }

        #[ink(message)]
        pub fn get_todo(&self, id: u64) -> Option<Todo> {
            let caller_h160 = self.env().caller();

            let mut data = [0u8; 32];
            data[12..].copy_from_slice(caller_h160.as_bytes());
            let caller = AccountId::from(data);
            // ✅ use &caller
            self.todos.get((&caller, id))
        }

        #[ink(message)]
        pub fn get_counter(&self, account_id: AccountId) -> u64 {
            // ✅ use &account_id
            self.counter.get(&account_id).unwrap_or_default()
        }
    }
    
}