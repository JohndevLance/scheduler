# Rules - React Web Application

## Web Application Rules

1. **This is a React web application (Vite + TypeScript)**
   - Do not suggest React Native or mobile-specific code
   - Do not use React Native components (`View`, `Text`, `TouchableOpacity`, etc.)
   - Use standard HTML elements and web APIs
   - Use Vite as the build tool (`npm run dev`, `npm run build`)

2. **Styling Approach**
   - Use CSS modules, Tailwind CSS, or standard CSS/SCSS for styling
   - Do not use `StyleSheet.create()` or React Native style objects
   - Use standard web CSS properties and units (px, rem, %, vh, vw)

3. **Routing**
   - Use React Router DOM for client-side routing
   - Do not use React Navigation (React Native)
   - Define routes using `<Routes>` and `<Route>` components

4. **Allowed Operations**
   - Code editing and review
   - File system operations
   - Web development tasks
   - Running `npm run dev` to start the Vite dev server
   - General web development tasks

## User Feedback and Notifications Rules

1. **Prefer ToastService over browser alerts**
   - Always use `ToastService.success()`, `ToastService.error()`, or `ToastService.info()` instead of `window.alert()` or `window.confirm()`
   - Import from `'../shared/services/ToastService'` (adjust path as needed)
   - Toast notifications provide better UX - they're non-blocking and less intrusive
   - Only use modal dialogs for critical confirmations that require user action (like delete confirmations)

2. **ToastService Usage Pattern**
   ```tsx
   // Import ToastService
   import { ToastService } from '../shared/services/ToastService';
   
   // Use for success messages
   ToastService.success({
     title: 'Success',
     message: 'Operation completed successfully'
   });
   
   // Use for error messages
   ToastService.error({
     title: 'Error',
     message: 'Something went wrong'
   });
   
   // Use for info messages
   ToastService.info({
     title: 'Info',
     message: 'Important information'
   });
   ```

3. **When to use modal dialogs vs ToastService**
   - **ToastService**: Success messages, error notifications, info messages, non-critical feedback
   - **Modal/Dialog**: Delete confirmations, destructive actions, critical decisions requiring user choice

## React Web Project Structure Rules

1. **Mandatory Folder Structure**
   - Create separate folders for different concerns
   - Never write all code in a single file
   - Follow modular architecture principles

2. **Required Folders and Their Purposes**
   - `src/pages/` - Top-level page components (one file per route/page)
   - `src/routes/` - React Router DOM route definitions
   - `src/components/` - Reusable UI components
   - `src/utils/` - Utility functions and helpers
   - `src/__tests__/` - Test files for components and functions
   - `src/api/` - API requests using React Query / axios
   - `src/assets/` - Project assets (images, fonts, SVGs, etc.)
   - `src/hooks/` - Custom React hooks
   - `src/helpers/` - Helper functions and utilities
   - `src/shared/` - Shared services, types, and constants

3. **Code Organization Guidelines**
   - Each page should be in its own file under `src/pages/`
   - Route definitions should be separated in `src/routes/`
   - Reusable components should be in `src/components/`
   - API calls should use React Query and be in `src/api/`
   - Custom hooks should be in `src/hooks/`
   - Utility functions should be in `src/utils/` or `src/helpers/`
   - Tests should be co-located or in `src/__tests__/`

4. **File Naming Conventions**
   - Use PascalCase for component and page files (e.g., `HomePage.tsx`)
   - Use camelCase for utility and service files (e.g., `apiHelpers.ts`)
   - Use descriptive names that indicate the purpose
   - Include file extensions (.tsx, .ts)

5. **When Creating React Web Projects**
   - Always set up the proper folder structure first
   - Create placeholder files for main pages
   - Set up React Router DOM route structure
   - Organize components by feature or type
   - Implement proper imports and exports

## Documentation Organization Rules

1. **AI-Generated Documentation Location**
   - All AI-generated documentation files (.md extension) must be placed in `docs/ai/` folder
   - Never create documentation .md files in the project root directory
   - Only exception: `Readme.md` remains in the project root

2. **Documentation File Types**
   - Implementation guides (e.g., `FEATURE_IMPLEMENTATION.md`)
   - Setup guides (e.g., `SETUP_GUIDE.md`)
   - Analysis documents (e.g., `ANALYSIS.md`)
   - Testing guides (e.g., `TEST_GUIDE.md`)
   - Architecture documentation
   - Migration guides
   - Any other AI-generated markdown documentation

3. **When Creating Documentation**
   - Always use the path `docs/ai/FILENAME.md`
   - Use descriptive, uppercase names with underscores
   - Include proper markdown formatting
   - Add table of contents for longer documents
   - Keep Readme.md in root for repository overview

4. **Documentation Maintenance**
   - Keep documentation organized by topic or feature
   - Update existing documentation rather than creating duplicates
   - Archive outdated documentation with an `ARCHIVE_` prefix
   - Ensure all documentation is referenced in appropriate locations

## shadcn/ui Component Rules

1. **Use shadcn/ui as the primary component library**
   - Always prefer shadcn/ui components over building custom UI from scratch
   - Install components via CLI: `npx shadcn@latest add <component>`
   - Components are added to `src/components/ui/` — do not edit them directly
   - Import from `'@/components/ui/<component>'`

2. **Available Components — Use These First**
   - Layout & Containers: `Card`, `Separator`, `ScrollArea`, `Sheet`, `Dialog`, `Drawer`
   - Forms & Inputs: `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `DatePicker`
   - Buttons & Actions: `Button`, `Toggle`, `ToggleGroup`, `DropdownMenu`, `ContextMenu`
   - Feedback: `Alert`, `Badge`, `Progress`, `Skeleton`, `Sonner` (toasts)
   - Navigation: `Tabs`, `Breadcrumb`, `NavigationMenu`, `Pagination`, `Sidebar`
   - Data Display: `Table`, `Avatar`, `Tooltip`, `HoverCard`, `Popover`, `Accordion`
   - Overlays: `AlertDialog`, `Dialog`, `Command` (command palette)

3. **Button Usage**
   - Always use the shadcn `Button` component — never use plain `<button>` elements
   - Use `variant` prop: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
   - Use `size` prop: `default`, `sm`, `lg`, `icon`
   ```tsx
   import { Button } from '@/components/ui/button';

   <Button variant="outline" size="sm" onClick={handleClick}>
     Save
   </Button>
   ```

4. **Form Integration with React Hook Form**
   - Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` wrappers
   - These integrate directly with `react-hook-form` `control`
   ```tsx
   import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
   import { Input } from '@/components/ui/input';

   <Form {...form}>
     <FormField
       control={form.control}
       name="email"
       render={({ field }) => (
         <FormItem>
           <FormLabel>Email</FormLabel>
           <FormControl>
             <Input placeholder="email@example.com" {...field} />
           </FormControl>
           <FormMessage />
         </FormItem>
       )}
     />
   </Form>
   ```

5. **Dialog / Modal Pattern**
   - Use shadcn `Dialog` for modals instead of custom overlay implementations
   ```tsx
   import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

   <Dialog>
     <DialogTrigger asChild>
       <Button variant="outline">Open</Button>
     </DialogTrigger>
     <DialogContent>
       <DialogHeader>
         <DialogTitle>Title</DialogTitle>
       </DialogHeader>
       {/* content */}
     </DialogContent>
   </Dialog>
   ```

6. **Data Tables**
   - Use shadcn `Table` components for tabular data
   - For complex tables with sorting/filtering, combine with `@tanstack/react-table`
   ```tsx
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
   ```

7. **Toasts**
   - Use shadcn `Sonner` (or `Toast`) for notifications instead of custom toast implementations
   - Integrate with `ToastService` to keep a consistent API across the app

8. **Theming and Customization**
   - Customize via CSS variables in `src/index.css` — do not override shadcn component files directly
   - Use the `cn()` utility (from `src/lib/utils.ts`) for conditional class merging
   ```tsx
   import { cn } from '@/lib/utils';

   <div className={cn('base-class', isActive && 'active-class')} />
   ```

9. **Path Alias**
   - shadcn/ui uses `@/` as a path alias for `src/`
   - Ensure `tsconfig.json` and `vite.config.ts` have the alias configured:
   ```ts
   // vite.config.ts
   resolve: { alias: { '@': '/src' } }
   ```

## General Development Guidelines

- Focus on code quality and web development best practices
- Use TypeScript strictly — avoid `any` types where possible
- Prefer functional components and React hooks over class components
- Use React Query for server state and avoid redundant local state for fetched data
- Provide helpful suggestions for code improvements
- Assist with debugging and problem-solving
- Support web development tasks (HTML, CSS, TypeScript, React)
- Maintain code documentation and structure
- Run `npm run dev` to start the Vite development server
- Run `npm run build` to create a production build

# React Query Rules

## Data Fetching with React Query

1. **Use React Query for all server state**
   - Never use `useEffect` + `useState` to fetch data — use `useQuery` instead
   - Use `useMutation` for all create, update, and delete operations
   - Keep server state in React Query cache; do not duplicate it in local state

2. **Query Key Conventions**
   - Always use descriptive, array-based query keys
   - Structure: `[entity, scope?, id?]` — e.g., `['users']`, `['users', 'detail', userId]`
   - Co-locate query keys with their query functions in `src/api/`

3. **useQuery Pattern**
   ```tsx
   import { useQuery } from '@tanstack/react-query';
   import { fetchUsers } from '../api/users';

   const { data, isLoading, isError, error } = useQuery({
     queryKey: ['users'],
     queryFn: fetchUsers,
   });
   ```

4. **useMutation Pattern**
   ```tsx
   import { useMutation, useQueryClient } from '@tanstack/react-query';
   import { createUser } from '../api/users';

   const queryClient = useQueryClient();

   const { mutate, isPending } = useMutation({
     mutationFn: createUser,
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['users'] });
       ToastService.success({ title: 'Success', message: 'User created' });
     },
     onError: (error) => {
       ToastService.error({ title: 'Error', message: error.message });
     },
   });
   ```

5. **API Layer (`src/api/`)**
   - Keep all axios/fetch calls in `src/api/` — never inline them in components
   - Export typed async functions that return data directly
   - Group by entity (e.g., `src/api/users.ts`, `src/api/schedules.ts`)
   ```ts
   // src/api/users.ts
   import axios from 'axios';
   import { User } from '../shared/types';

   export const fetchUsers = async (): Promise<User[]> => {
     const { data } = await axios.get('/api/users');
     return data;
   };
   ```

6. **Query Client Setup**
   - Configure `QueryClient` once in `main.tsx` or a dedicated provider file
   - Set sensible defaults: `staleTime`, `retry`, `refetchOnWindowFocus`
   ```tsx
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60 * 5, // 5 minutes
         retry: 1,
         refetchOnWindowFocus: false,
       },
     },
   });
   ```

7. **Loading and Error States**
   - Always handle `isLoading` and `isError` in components
   - Show skeleton/spinner for loading, error message for failures
   - Use `isPending` for mutation loading states

# Custom Hooks Rules

## Hook Implementation Guidelines

1. **When to create a custom hook**
   - Encapsulate React Query calls for a specific entity (e.g., `useUsers`, `useSchedule`)
   - Share stateful logic across multiple components
   - Abstract complex side effects or event listeners
   - Never repeat the same `useQuery`/`useMutation` setup in multiple components

2. **Hook Naming and Location**
   - All custom hooks live in `src/hooks/`
   - Always prefix with `use` (e.g., `useUsers.ts`, `useScheduleForm.ts`)
   - One hook per file; file name matches hook name

3. **Data-Fetching Hook Pattern**
   ```tsx
   // src/hooks/useUsers.ts
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { fetchUsers, createUser, deleteUser } from '../api/users';
   import { ToastService } from '../shared/services/ToastService';

   export const useUsers = () => {
     const queryClient = useQueryClient();

     const query = useQuery({
       queryKey: ['users'],
       queryFn: fetchUsers,
     });

     const create = useMutation({
       mutationFn: createUser,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['users'] });
         ToastService.success({ title: 'Success', message: 'User created' });
       },
       onError: (error: Error) => {
         ToastService.error({ title: 'Error', message: error.message });
       },
     });

     const remove = useMutation({
       mutationFn: deleteUser,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['users'] });
         ToastService.success({ title: 'Success', message: 'User deleted' });
       },
     });

     return { ...query, create, remove };
   };
   ```

4. **UI / Utility Hook Pattern**
   ```tsx
   // src/hooks/useDebounce.ts
   import { useState, useEffect } from 'react';

   export const useDebounce = <T>(value: T, delay = 300): T => {
     const [debounced, setDebounced] = useState(value);
     useEffect(() => {
       const timer = setTimeout(() => setDebounced(value), delay);
       return () => clearTimeout(timer);
     }, [value, delay]);
     return debounced;
   };
   ```

5. **Hook Usage in Components**
   - Import and call the hook at the top of the component
   - Destructure only what the component needs
   ```tsx
   const { data: users, isLoading, create } = useUsers();
   ```

6. **Rules**
   - Hooks must only be called at the top level — never inside loops, conditions, or nested functions
   - Do not call hooks inside event handlers; call them in the component body and pass results to handlers
   - Keep hooks focused — split into smaller hooks if a single hook grows too large
   - Always type hook return values with TypeScript interfaces

# React Hook Form Implementation

## React Hook Form Rules

1. **Use React Hook Form for all forms**
   - Import `useForm` from 'react-hook-form'
   - Use `useForm()` hook to manage form state
   - Implement proper validation using `register` or `Controller`

2. **Shared Input Components with Controllers**
   - Create reusable input components using `Controller` from react-hook-form
   - All shared inputs must accept `control` prop from parent
   - Use `Controller` wrapper for form integration
   - Implement proper error handling and validation display

3. **Input Component Structure**
   ```tsx
   interface SharedInputProps {
     control: Control<any>;
     name: string;
     label?: string;
     placeholder?: string;
     rules?: RegisterOptions;
     error?: string;
   }
   ```

4. **Form Implementation Pattern**
   ```tsx
   const { control, handleSubmit, formState: { errors } } = useForm();
   
   const onSubmit = (data: FormData) => {
     // Handle form submission
   };
   ```

5. **Controller Usage**
   - Wrap all form inputs with `Controller`
   - Pass `control` prop from parent form
   - Use `field` prop for input value and onChange
   - Display errors from `formState.errors`

6. **Validation Rules**
   - Use `rules` prop for field validation
   - Implement required, pattern, minLength, maxLength validations
   - Display validation errors using `formState.errors`

7. **Form Submission**
   - Use `handleSubmit` wrapper for form submission
   - Prevent default form behavior
   - Handle loading states and error states

## Implementation Guidelines

- Always use `Controller` for complex inputs (custom components, third-party inputs)
- Use `register` for simple HTML inputs
- Implement proper TypeScript interfaces for form data
- Use `zodResolver` for schema validation when needed
- Create reusable form components that accept `control` prop
- Maintain consistent error handling across all forms 