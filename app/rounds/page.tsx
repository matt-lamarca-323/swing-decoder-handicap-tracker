'use client'

import { useEffect, useState } from 'react'
import { Container, Table, Button, Alert, Spinner, Badge } from 'react-bootstrap'
import Link from 'next/link'

interface Round {
  id: number
  userId: number
  courseName: string
  datePlayed: string
  score: number
  holes: number
  courseRating: number | null
  slopeRating: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string
    email: string
  }
}

export default function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRounds()
  }, [])

  const fetchRounds = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rounds')
      if (!response.ok) throw new Error('Failed to fetch rounds')
      const data = await response.json()
      setRounds(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this round?')) return

    try {
      const response = await fetch(`/api/rounds/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete round')

      // Refresh the list
      fetchRounds()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete round')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
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
        <h1>Golf Rounds</h1>
        <Link href="/rounds/new" passHref legacyBehavior>
          <Button variant="primary">Add New Round</Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {rounds.length === 0 ? (
        <Alert variant="info">
          No rounds found. Click &quot;Add New Round&quot; to create one.
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Player</th>
              <th>Course</th>
              <th>Score</th>
              <th>Holes</th>
              <th>Rating/Slope</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map((round) => (
              <tr key={round.id}>
                <td>{formatDate(round.datePlayed)}</td>
                <td>
                  <Link href={`/users/${round.user.id}/edit`} className="text-decoration-none">
                    {round.user.name}
                  </Link>
                </td>
                <td>{round.courseName}</td>
                <td>
                  <strong>{round.score}</strong>
                </td>
                <td>
                  <Badge bg={round.holes === 18 ? 'primary' : 'secondary'}>
                    {round.holes}
                  </Badge>
                </td>
                <td>
                  {round.courseRating && round.slopeRating
                    ? `${round.courseRating} / ${round.slopeRating}`
                    : 'N/A'}
                </td>
                <td>
                  {round.notes ? (
                    <small className="text-muted">
                      {round.notes.length > 30
                        ? `${round.notes.substring(0, 30)}...`
                        : round.notes}
                    </small>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td>
                  <Link href={`/rounds/${round.id}/edit`} passHref legacyBehavior>
                    <Button variant="outline-primary" size="sm" className="me-2">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(round.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="mt-3">
        <Link href="/" passHref legacyBehavior>
          <Button variant="secondary">Back to Home</Button>
        </Link>
      </div>
    </Container>
  )
}
