"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminRecord, EmployeeRecord } from "@/app/Data/database";

function AdminCreationForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    adminId: '',
    level: '1'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          level: parseInt(formData.level)
        }),
      });

      if (response.ok) {
        alert('Admin created successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      alert('Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purple-50 p-6 rounded-lg shadow-md mb-8 border border-purple-200">
      <h2 className="text-xl font-semibold mb-4 text-purple-900">Create New Administrator</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin ID *</label>
          <input
            type="text"
            value={formData.adminId}
            onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Level</label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="1">Level 1 - Basic Admin</option>
            <option value="2">Level 2 - Senior Admin</option>
            <option value="3">Level 3 - Super Admin</option>
          </select>
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EmployeesManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    employeeId: '',
    department: '',
    position: '',
    salary: '',
    isActive: true
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    fetchEmployees();
    fetchAdmins();
  }, [session, status, router]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/admin/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingEmployee ? 'PATCH' : 'POST';
      const url = editingEmployee
        ? `/api/admin/employees/${editingEmployee.id}`
        : '/api/admin/employees';

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : null
        }),
      });

      if (response.ok) {
        await fetchEmployees();
        resetForm();
        alert(editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      alert('Failed to save employee');
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEmployees();
        alert('Employee deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert('Failed to delete employee');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      employeeId: '',
      department: '',
      position: '',
      salary: '',
      isActive: true
    });
    setEditingEmployee(null);
    setShowAddForm(false);
  };

  const editEmployee = (employee: EmployeeRecord) => {
    setFormData({
      email: employee.user.email,
      name: employee.user.name || '',
      employeeId: employee.employeeId,
      department: employee.department || '',
      position: employee.position || '',
      salary: employee.salary?.toString() || '',
      isActive: employee.isActive
    });
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-red-600">
          Access denied. This page is only for admins.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Management</h1>
        <p className="text-gray-600">Manage employees and their information</p>
      </div>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : 'Add New Employee'}
        </button>
        <button
          onClick={() => setShowAddAdminForm(!showAddAdminForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          {showAddAdminForm ? 'Cancel' : 'Create Admin'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
                disabled={!!editingEmployee}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                step="0.01"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                Active Employee
              </label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddAdminForm && (
        <AdminCreationForm
          onSuccess={() => {
            setShowAddAdminForm(false);
            fetchAdmins();
          }}
          onCancel={() => setShowAddAdminForm(false)}
        />
      )}

      {/* Employees Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Employees</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.user.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.position || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => editEmployee(employee)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No employees found.
          </div>
        )}
      </div>

      {/* Admins Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Administrators</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {admin.adminId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.user.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admins.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No administrators found.
          </div>
        )}
      </div>
    </div>
  );
}
