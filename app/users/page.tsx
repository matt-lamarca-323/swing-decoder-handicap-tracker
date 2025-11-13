'use client'

import { useEffect, useState } from 'react'
import { Container, Table, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface User {
  id: number
  email: string
  name: string
  handicapIndex: number | null
  rounds: number
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect non-admins
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user?.role !== 'ADMIN') {
      router.push('/rounds')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete user')

      // Refresh the list
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  // Show loading while checking auth or fetching data
  if (status === 'loading' || loading || !session || session.user?.role !== 'ADMIN') {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Profiles</h1>
        <Link href="/users/new" passHref legacyBehavior>
          <Button variant="primary">Add New User</Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {users.length === 0 ? (
        <Alert variant="info">
          No users found. Click &quot;Add New User&quot; to create one.
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Handicap Index</th>
              <th>Rounds</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  {user.handicapIndex !== null
                    ? user.handicapIndex.toFixed(1)
                    : 'N/A'}
                </td>
                <td>{user.rounds}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/users/${user.id}/edit`} passHref legacyBehavior>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Link href="/" passHref legacyBehavior>
        <Button variant="secondary" className="mt-3">
          Back to Home
        </Button>
      </Link>
    </Container>
  )
}
