#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod todo_app {
    use ink::prelude::string::String;
    use ink::storage::Mapping;
    use ink::{H160, U256};

    #[cfg_attr(
        feature = "std",
        derive(
            Debug,
            PartialEq,
            Eq,
            ink::storage::traits::StorageLayout,
        )
    )]
    pub struct Todo {
        pub id: u64,
        pub content: String,
        pub completed: bool,
        pub amount: U256,
    }

     #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        NotEnoughFunds,
        InvalidTodo
    }

    #[ink(storage)]
    #[derive(Default)]
    pub struct TodoApp {
        todos: Mapping<(H160, u64), Todo>,
        counter: Mapping<H160, u64>,
    }

    impl TodoApp {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                todos: Mapping::default(),
                counter: Mapping::default(),
            }
        }

        #[ink(message, payable)]
        pub fn add_todo(&mut self, content: String) -> Result<(), Error> {
            if self.env().transferred_value() < U256::from(100 * 10u128.pow(10)) {
                return Err(Error::NotEnoughFunds);
            }

            let caller = self.env().caller();
            let id = self.counter.get(caller).unwrap_or_default();

            let todo = Todo {
                id,
                content,
                completed: false,
                amount: self.env().transferred_value(),
            };
           
            self.todos.insert((&caller, id), &todo);

            let next_id = id.checked_add(1).unwrap_or(id + 1);
            self.counter.insert(&caller, &next_id);

            Ok(())
        }

        #[ink(message)]
        pub fn toggle_todo(&mut self, id: u64) -> Option<bool> {
            let caller = self.env().caller();

            // ✅ use &caller
            if let Some(mut todo) = self.todos.get((caller, id)) {
                todo!()
            } else {
                None
            }
        }

        #[ink(message)]
        pub fn get_todo(&self, id: u64) -> Option<Todo> {
            todo!()
        }

        #[ink(message)]
        pub fn get_counter(&self, account_id: H160) -> u64 {
            // ✅ use &account_id
            self.counter.get(&account_id).unwrap_or_default()
        }
    }
    
}
