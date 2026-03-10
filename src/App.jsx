import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import OrderForm from './pages/OrderForm';
import CustomerOrderForm from './pages/CustomerOrderForm';
import OrdersList from './pages/OrdersList';
import OrderDetails from './pages/OrderDetails';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Users from './pages/Users';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />

        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/new" element={<OrderForm />} />
        <Route path="orders/customer-issue" element={<CustomerOrderForm />} />
        <Route path="orders/:id" element={<OrderDetails />} />

        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="products" element={<Products />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}

export default App;
