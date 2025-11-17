'use client'

import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Alert, Spinner, Table, Badge } from 'react-bootstrap'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DashboardStats {
  handicapIndex: number | null
  calculatedHandicapIndex: number | null
  numberOfDifferentialsUsed: number
  totalRounds: number
  roundsWithDifferential: number
  averageScore: number | null
  greensInRegulationPct: number | null
  fairwaysInRegulationPct: number | null
  averagePutts: number | null
  upAndDownPct: number | null
  recentRounds: Array<{
    id: number
    courseName: string
    datePlayed: string
    score: number
    holes: number
    handicapDifferential: number | null
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchStats()
    }
  }, [session])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (status === 'loading' || loading || !session) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Container className="py-5">
      <div className="mb-4">
        <h1>Welcome back, {session.user?.name}!</h1>
        <p className="text-muted">Here&apos;s your golf performance summary</p>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Main Stats Cards */}
      <Row className="mb-4 g-3">
        <Col md={3} sm={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <Card.Title className="text-muted small mb-2">Handicap Index</Card.Title>
              <div className="display-4 fw-bold text-primary">
                {stats.calculatedHandicapIndex !== null ? stats.calculatedHandicapIndex.toFixed(1) : 'N/A'}
              </div>
              {stats.calculatedHandicapIndex !== null && (
                <small className="text-muted">
                  Based on {stats.numberOfDifferentialsUsed} best of {stats.roundsWithDifferential}
                </small>
              )}
              {stats.calculatedHandicapIndex === null && stats.totalRounds > 0 && (
                <small className="text-muted">
                  Add course rating & slope to rounds
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <Card.Title className="text-muted small mb-2">Total Rounds</Card.Title>
              <div className="display-4 fw-bold text-success">
                {stats.totalRounds}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <Card.Title className="text-muted small mb-2">Average Score</Card.Title>
              <div className="display-4 fw-bold text-info">
                {stats.averageScore !== null ? stats.averageScore.toFixed(1) : 'N/A'}
              </div>
              <small className="text-muted">18-hole rounds</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="text-center">
              <Card.Title className="text-muted small mb-2">Average Putts</Card.Title>
              <div className="display-4 fw-bold text-warning">
                {stats.averagePutts !== null ? stats.averagePutts.toFixed(1) : 'N/A'}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Performance Stats */}
      <Row className="mb-4 g-3">
        <Col lg={3} md={6}>
          <Card className="h-100 shadow-sm border-start border-primary border-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted small mb-1">GIR</Card.Title>
                  <div className="h3 mb-0 fw-bold">
                    {stats.greensInRegulationPct !== null ? `${stats.greensInRegulationPct.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="display-6 text-primary opacity-25">
                  🎯
                </div>
              </div>
              <small className="text-muted">Greens in Regulation</small>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100 shadow-sm border-start border-success border-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted small mb-1">FIR</Card.Title>
                  <div className="h3 mb-0 fw-bold">
                    {stats.fairwaysInRegulationPct !== null ? `${stats.fairwaysInRegulationPct.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="display-6 text-success opacity-25">
                  ⛳
                </div>
              </div>
              <small className="text-muted">Fairways in Regulation</small>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100 shadow-sm border-start border-warning border-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title className="text-muted small mb-1">Par Save</Card.Title>
                  <div className="h3 mb-0 fw-bold">
                    {stats.upAndDownPct !== null ? `${stats.upAndDownPct.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
                <div className="display-6 text-warning opacity-25">
                  🏌️
                </div>
              </div>
              <small className="text-muted">Short Game Success</small>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="h-100 shadow-sm border-start border-info border-4">
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
              <Link href="/rounds/new" className="btn btn-primary btn-lg w-100">
                Add New Round
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Rounds */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Rounds</h5>
                <Link href="/rounds" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {stats.recentRounds.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No rounds recorded yet</p>
                  <Link href="/rounds/new" className="btn btn-primary">
                    Record Your First Round
                  </Link>
                </div>
              ) : (
                <Table hover responsive className="mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course</th>
                      <th>Score</th>
                      <th>Holes</th>
                      <th>Differential</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentRounds.map((round) => (
                      <tr key={round.id}>
                        <td>{formatDate(round.datePlayed)}</td>
                        <td>{round.courseName}</td>
                        <td>
                          <strong className="text-primary">{round.score}</strong>
                        </td>
                        <td>
                          <Badge bg={round.holes === 18 ? 'primary' : 'secondary'}>
                            {round.holes}
                          </Badge>
                        </td>
                        <td>
                          {round.handicapDifferential !== null ? (
                            <Badge bg="info">{round.handicapDifferential.toFixed(1)}</Badge>
                          ) : (
                            <span className="text-muted small">N/A</span>
                          )}
                        </td>
                        <td className="text-end">
                          <Link href={`/rounds/${round.id}/edit`} className="btn btn-sm btn-outline-secondary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats Notice */}
      {stats.totalRounds === 0 && (
        <Alert variant="info" className="mt-4">
          <Alert.Heading>Get Started!</Alert.Heading>
          <p>
            Start tracking your golf performance by recording your rounds.
            Add course details, scores, and statistics to see your progress over time.
          </p>
        </Alert>
      )}

      {stats.totalRounds > 0 && stats.greensInRegulationPct === null && (
        <Alert variant="info" className="mt-4">
          <Alert.Heading>Track More Stats!</Alert.Heading>
          <p>
            Add detailed statistics (GIR, FIR, putts, up & down) to your rounds
            to get a complete picture of your game.
          </p>
        </Alert>
      )}
    </Container>
  )
}
