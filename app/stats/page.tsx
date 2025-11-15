'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Row, Col, Form, Button, Spinner, Alert, Badge } from 'react-bootstrap'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  totalRounds: number
  girPercentage: number
  firPercentage: number
  avgPutts: number
  avgPuttsPerGIR: number
  avgScore: number
  firStreak: number
  no3PuttStreak: number
  noDoubleBogeyStreak: number
  totalGIR: number
  totalGIROpportunities: number
  totalFIR: number
  totalFIROpportunities: number
}

export default function StatsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [courses, setCourses] = useState<string[]>([])

  // Filter state
  const [filter, setFilter] = useState('alltime')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats()
      fetchCourses()
    }
  }, [status])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/rounds')
      if (response.ok) {
        const rounds = await response.json()
        const uniqueCourses = [...new Set(rounds.map((r: any) => r.courseName))].sort()
        setCourses(uniqueCourses as string[])
      }
    } catch (err) {
      console.error('Error fetching courses:', err)
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    setError(null)

    try {
      let url = `/api/stats?filter=${filter}`

      if (filter === 'daterange' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`
      } else if (filter === 'course' && selectedCourse) {
        url += `&courseName=${encodeURIComponent(selectedCourse)}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
  }

  const handleApplyFilter = () => {
    fetchStats()
  }

  if (status === 'loading' || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Golf Statistics</h1>
        <Link href="/rounds" className="btn btn-secondary">
          Back to Rounds
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Filters</h5>
          <Row className="g-3">
            <Col md={12}>
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant={filter === 'alltime' ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('alltime')}
                >
                  All Time
                </Button>
                <Button
                  variant={filter === 'last5' ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('last5')}
                >
                  Last 5
                </Button>
                <Button
                  variant={filter === 'last10' ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('last10')}
                >
                  Last 10
                </Button>
                <Button
                  variant={filter === 'last15' ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('last15')}
                >
                  Last 15
                </Button>
                <Button
                  variant={filter === 'last20' ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('last20')}
                >
                  Last 20
                </Button>
                <Button
                  variant={filter === 'daterange' ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('daterange')}
                >
                  Date Range
                </Button>
                <Button
                  variant={filter === 'course' ? 'primary' : 'outline-primary'}
                  onClick={() => handleFilterChange('course')}
                >
                  By Course
                </Button>
              </div>
            </Col>

            {filter === 'daterange' && (
              <>
                <Col md={4}>
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Col>
              </>
            )}

            {filter === 'course' && (
              <Col md={6}>
                <Form.Label>Select Course</Form.Label>
                <Form.Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            )}

            {(filter === 'daterange' || filter === 'course') && (
              <Col md={12}>
                <Button onClick={handleApplyFilter}>Apply Filter</Button>
              </Col>
            )}

            {!['daterange', 'course'].includes(filter) && (
              <Col md={12}>
                <Button onClick={handleApplyFilter}>Refresh Stats</Button>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Statistics Display */}
      {stats && (
        <>
          <Row className="mb-4">
            <Col md={12}>
              <Card className="bg-light">
                <Card.Body>
                  <h5 className="mb-0">
                    Total Rounds: <Badge bg="primary">{stats.totalRounds}</Badge>
                  </h5>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            {/* Scoring Average */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="text-muted mb-2">Scoring Average</h6>
                  <h2 className="mb-0">{stats.avgScore}</h2>
                </Card.Body>
              </Card>
            </Col>

            {/* GIR */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="text-muted mb-2">Greens in Regulation</h6>
                  <h2 className="mb-1">{stats.girPercentage}%</h2>
                  <small className="text-muted">
                    {stats.totalGIR} / {stats.totalGIROpportunities}
                  </small>
                </Card.Body>
              </Card>
            </Col>

            {/* FIR */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="text-muted mb-2">Fairways in Regulation</h6>
                  <h2 className="mb-1">{stats.firPercentage}%</h2>
                  <small className="text-muted">
                    {stats.totalFIR} / {stats.totalFIROpportunities}
                  </small>
                </Card.Body>
              </Card>
            </Col>

            {/* Average Putts */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="text-muted mb-2">Average Putts per Round</h6>
                  <h2 className="mb-0">{stats.avgPutts}</h2>
                </Card.Body>
              </Card>
            </Col>

            {/* Putts per GIR */}
            <Col md={6} lg={4}>
              <Card className="h-100">
                <Card.Body>
                  <h6 className="text-muted mb-2">Putts per GIR</h6>
                  <h2 className="mb-0">{stats.avgPuttsPerGIR}</h2>
                </Card.Body>
              </Card>
            </Col>

            {/* FIR Streak */}
            <Col md={6} lg={4}>
              <Card className="h-100 border-success">
                <Card.Body>
                  <h6 className="text-muted mb-2">Longest FIR Streak</h6>
                  <h2 className="mb-0 text-success">{stats.firStreak} holes</h2>
                </Card.Body>
              </Card>
            </Col>

            {/* No 3-Putt Streak */}
            <Col md={6} lg={4}>
              <Card className="h-100 border-success">
                <Card.Body>
                  <h6 className="text-muted mb-2">Longest No 3-Putt Streak</h6>
                  <h2 className="mb-0 text-success">{stats.no3PuttStreak} holes</h2>
                </Card.Body>
              </Card>
            </Col>

            {/* No Double Bogey Streak */}
            <Col md={6} lg={4}>
              <Card className="h-100 border-success">
                <Card.Body>
                  <h6 className="text-muted mb-2">Longest No Double Bogey Streak</h6>
                  <h2 className="mb-0 text-success">{stats.noDoubleBogeyStreak} holes</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}
