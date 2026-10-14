import { Navigate, type RouteObject } from 'react-router'
import { App } from './App.tsx'
import { GuestOnly, RequireAuth } from './components/RouteGuards.tsx'
import { Budgets } from './pages/Budgets.tsx'
import { Categories } from './pages/Categories.tsx'
import { Login } from './pages/Login.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { Register } from './pages/Register.tsx'
import { Transactions } from './pages/Transactions.tsx'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          // The dashboard will take over the index route in a later milestone.
          { index: true, element: <Navigate to="/transactions" replace /> },
          { path: 'transactions', element: <Transactions /> },
          { path: 'budgets', element: <Budgets /> },
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
