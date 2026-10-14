import type { RouteObject } from 'react-router'
import { App } from './App.tsx'
import { GuestOnly, RequireAuth } from './components/RouteGuards.tsx'
import { Budgets } from './pages/Budgets.tsx'
import { Categories } from './pages/Categories.tsx'
import { Login } from './pages/Login.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { Overview } from './pages/Overview.tsx'
import { Register } from './pages/Register.tsx'
import { Savings } from './pages/Savings.tsx'
import { Transactions } from './pages/Transactions.tsx'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <Overview /> },
          { path: 'transactions', element: <Transactions /> },
          { path: 'budgets', element: <Budgets /> },
          { path: 'savings', element: <Savings /> },
          {
            path: 'reports',
            // Loaded on demand: the chart library is large and only used here.
            lazy: async () => ({ Component: (await import('./pages/Reports.tsx')).Reports }),
          },
          { path: 'categories', element: <Categories /> },
        ],
      },
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]
