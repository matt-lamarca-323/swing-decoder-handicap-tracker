'use client'

import { useEffect, useState } from 'react'
import { Container, Form, Button, Alert, Card, Spinner } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: number
  email: string
  name: string
  handicapIndex: number | null
  rounds: number
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    handicapIndex: '',
    rounds: '0',
  })
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      const user: User = await response.json()

      setFormData({
        name: user.name,
        email: user.email,
        handicapIndex: user.handicapIndex?.toString() || '',
        rounds: user.rounds.toString(),
      })
    } catch (err) {
      setErrors(['Failed to load user data'])
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        handicapIndex: formData.handicapIndex
          ? parseFloat(formData.handicapIndex)
          : null,
        rounds: parseInt(formData.rounds) || 0,
      }

      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.details) {
          setErrors(data.details.map((err: any) => err.message))
        } else {
          setErrors([data.error || 'Failed to update user'])
        }
        return
      }

      router.push('/users')
    } catch (err) {
      setErrors(['An unexpected error occurred'])
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
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
      <Card>
        <Card.Header>
          <h2>Edit User</h2>
        </Card.Header>
        <Card.Body>
          {errors.length > 0 && (
            <Alert variant="danger">
              <ul className="mb-0">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email address"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Handicap Index</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                name="handicapIndex"
                value={formData.handicapIndex}
                onChange={handleChange}
                placeholder="Enter handicap index (optional)"
              />
              <Form.Text className="text-muted">
                Optional - Leave blank if not applicable
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Number of Rounds</Form.Label>
              <Form.Control
                type="number"
                name="rounds"
                value={formData.rounds}
                onChange={handleChange}
                min="0"
                placeholder="Number of rounds played"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </Button>
              <Link href="/users" passHref legacyBehavior>
                <Button variant="secondary">Cancel</Button>
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}
