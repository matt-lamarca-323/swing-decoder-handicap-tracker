'use client'

import { useState, useEffect } from 'react'
import { Container, Form, Button, Alert, Card, Row, Col, Table, Badge } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  HoleData,
  generateDefaultHoles,
  calculateRoundStats,
  validateHoleData,
  calculateGIR,
  calculateUpAndDown,
  STANDARD_PARS
} from '@/lib/golf-calculator'

export default function NewRoundPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entryMode, setEntryMode] = useState<'simple' | 'detailed'>('simple')

  // Simple mode fields
  const [courseName, setCourseName] = useState('')
  const [datePlayed, setDatePlayed] = useState('')
  const [holes, setHoles] = useState(18)
  const [totalScore, setTotalScore] = useState<number | ''>('')
  const [totalPutts, setTotalPutts] = useState<number | ''>('')
  const [courseRating, setCourseRating] = useState<number | ''>('')
  const [slopeRating, setSlopeRating] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  // Detailed mode
  const [holeData, setHoleData] = useState<HoleData[]>(generateDefaultHoles(18))

  // Calculated stats preview
  const [calculatedStats, setCalculatedStats] = useState<any>(null)

  useEffect(() => {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0]
    setDatePlayed(today)
  }, [])

  useEffect(() => {
    // Recalculate when hole data changes in detailed mode
    if (entryMode === 'detailed') {
      const errors = validateHoleData(holeData)
      if (errors.length === 0 && holeData.some(h => h.score > 0)) {
        const stats = calculateRoundStats(holeData)
        setCalculatedStats(stats)
      } else {
        setCalculatedStats(null)
      }
    }
  }, [holeData, entryMode])

  const handleHolesChange = (numHoles: number) => {
    setHoles(numHoles)
    if (entryMode === 'detailed') {
      setHoleData(generateDefaultHoles(numHoles))
    }
  }

  const handleHoleChange = (index: number, field: keyof HoleData, value: any) => {
    const newHoleData = [...holeData]
    newHoleData[index] = { ...newHoleData[index], [field]: value }
    setHoleData(newHoleData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let roundData: any = {
        userId: parseInt(session?.user?.id || '0'),
        courseName,
        datePlayed: new Date(datePlayed).toISOString(),
        holes,
        courseRating: courseRating || null,
        slopeRating: slopeRating || null,
        notes: notes || null,
      }

      if (entryMode === 'simple') {
        // Simple mode: use totals only
        roundData.score = Number(totalScore)
        roundData.putts = totalPutts ? Number(totalPutts) : null

        // Auto-calculate basic stats if putts are provided
        if (totalPutts) {
          const coursePar = holes === 18 ? 72 : 36
          // Estimate GIR from putts
          const avgPuttsPerHole = Number(totalPutts) / holes
          let estimatedGIR = 0

          if (avgPuttsPerHole < 1.7) estimatedGIR = Math.round(holes * 0.3)
          else if (avgPuttsPerHole < 2.0) estimatedGIR = Math.round(holes * 0.65)
          else if (avgPuttsPerHole < 2.2) estimatedGIR = Math.round(holes * 0.45)
          else estimatedGIR = Math.round(holes * 0.25)

          const missedGreens = holes - estimatedGIR
          const strokesOverPar = Number(totalScore) - coursePar
          const expectedStrokesOverPar = missedGreens * 0.5
          const upAndDownSuccess = strokesOverPar < expectedStrokesOverPar ? 0.6 : 0.3
          const estimatedUpAndDowns = Math.round(missedGreens * upAndDownSuccess)

          roundData.greensInRegulation = estimatedGIR
          roundData.upAndDowns = estimatedUpAndDowns
          roundData.upAndDownAttempts = missedGreens
          roundData.girPutts = Math.round(estimatedGIR * 2)
          roundData.nonGirPutts = Number(totalPutts) - Math.round(estimatedGIR * 2)
        }
      } else {
        // Detailed mode: calculate from hole-by-hole data
        const errors = validateHoleData(holeData)
        if (errors.length > 0) {
          setError(errors.join(', '))
          setLoading(false)
          return
        }

        const stats = calculateRoundStats(holeData)
        roundData.score = stats.totalScore
        roundData.putts = stats.totalPutts
        roundData.greensInRegulation = stats.greensInRegulation
        roundData.fairwaysInRegulation = stats.fairwaysInRegulation
        roundData.upAndDowns = stats.upAndDowns
        roundData.upAndDownAttempts = stats.upAndDownAttempts
        roundData.girPutts = stats.girPutts
        roundData.nonGirPutts = stats.nonGirPutts
        roundData.holeByHoleData = holeData
      }

      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roundData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create round')
      }

      router.push('/rounds')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Add New Round</h1>
        <Link href="/rounds" className="btn btn-outline-secondary">
          Cancel
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">Round Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Name *</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Pebble Beach Golf Links"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date Played *</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={datePlayed}
                    onChange={(e) => setDatePlayed(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Holes *</Form.Label>
                  <Form.Select
                    value={holes}
                    onChange={(e) => handleHolesChange(Number(e.target.value))}
                  >
                    <option value={9}>9 Holes</option>
                    <option value={18}>18 Holes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Rating</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={courseRating}
                    onChange={(e) => setCourseRating(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 72.3"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Slope Rating</Form.Label>
                  <Form.Control
                    type="number"
                    value={slopeRating}
                    onChange={(e) => setSlopeRating(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g., 135"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Score Entry Mode Selection */}
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">Score Entry</h5>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <Form.Check
                inline
                type="radio"
                label="Simple (Total Score & Putts)"
                name="entryMode"
                id="simple"
                checked={entryMode === 'simple'}
                onChange={() => setEntryMode('simple')}
              />
              <Form.Check
                inline
                type="radio"
                label="Detailed (Hole-by-Hole)"
                name="entryMode"
                id="detailed"
                checked={entryMode === 'detailed'}
                onChange={() => setEntryMode('detailed')}
              />
            </div>

            {entryMode === 'simple' ? (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Score *</Form.Label>
                    <Form.Control
                      type="number"
                      required
                      value={totalScore}
                      onChange={(e) => setTotalScore(e.target.value ? Number(e.target.value) : '')}
                      placeholder={`e.g., ${holes === 18 ? '85' : '45'}`}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Putts</Form.Label>
                    <Form.Control
                      type="number"
                      value={totalPutts}
                      onChange={(e) => setTotalPutts(e.target.value ? Number(e.target.value) : '')}
                      placeholder={`e.g., ${holes === 18 ? '32' : '16'}`}
                    />
                    <Form.Text className="text-muted">
                      Optional: Stats will be auto-calculated if provided
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            ) : (
              <div>
                <Alert variant="info" className="mb-3">
                  <small>
                    <strong>Tip:</strong> Enter your score and putts for each hole.
                    GIR, up & down stats will be calculated automatically!
                  </small>
                </Alert>
                <div className="table-responsive">
                  <Table bordered hover size="sm">
                    <thead className="table-light">
                      <tr>
                        <th style={{width: '60px'}}>Hole</th>
                        <th style={{width: '60px'}}>Par</th>
                        <th>Score *</th>
                        <th>Putts *</th>
                        <th>Fairway</th>
                        <th style={{width: '60px'}}>GIR</th>
                        <th style={{width: '80px'}}>Up&Down</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holeData.slice(0, holes).map((hole, index) => {
                        const hasValidData = hole.score > 0 && hole.putts >= 0
                        const hitGIR = hasValidData ? calculateGIR(hole.par, hole.score, hole.putts) : false
                        const upDownResult = hasValidData ? calculateUpAndDown(hole.par, hole.score, hole.putts, hitGIR) : { isAttempt: false, isSuccess: false }

                        return (
                          <tr key={hole.holeNumber}>
                            <td className="text-center"><strong>{hole.holeNumber}</strong></td>
                            <td>
                              <Form.Control
                                type="number"
                                size="sm"
                                min={3}
                                max={6}
                                value={hole.par}
                                onChange={(e) => handleHoleChange(index, 'par', Number(e.target.value))}
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                size="sm"
                                min={1}
                                value={hole.score || ''}
                                onChange={(e) => handleHoleChange(index, 'score', Number(e.target.value))}
                                placeholder="Score"
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                size="sm"
                                min={0}
                                value={hole.putts || ''}
                                onChange={(e) => handleHoleChange(index, 'putts', Number(e.target.value))}
                                placeholder="Putts"
                              />
                            </td>
                            <td>
                              {hole.par > 3 && (
                                <Form.Select
                                  size="sm"
                                  value={hole.fairwayHit === undefined ? '' : hole.fairwayHit ? 'true' : 'false'}
                                  onChange={(e) => handleHoleChange(index, 'fairwayHit', e.target.value === '' ? undefined : e.target.value === 'true')}
                                >
                                  <option value="">-</option>
                                  <option value="true">✓</option>
                                  <option value="false">✗</option>
                                </Form.Select>
                              )}
                            </td>
                            <td className="text-center">
                              {hasValidData && (
                                <span className={hitGIR ? 'text-success' : 'text-muted'}>
                                  {hitGIR ? '✓' : '✗'}
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              {hasValidData && upDownResult.isAttempt && (
                                <span className={upDownResult.isSuccess ? 'text-success' : 'text-danger'}>
                                  {upDownResult.isSuccess ? '✓' : '✗'}
                                </span>
                              )}
                              {hasValidData && !upDownResult.isAttempt && (
                                <span className="text-muted small">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>

                {calculatedStats && (
                  <Alert variant="success" className="mt-3">
                    <Row>
                      <Col xs={6} md={3}><strong>Total:</strong> {calculatedStats.totalScore}</Col>
                      <Col xs={6} md={3}><strong>Putts:</strong> {calculatedStats.totalPutts}</Col>
                      <Col xs={6} md={3}><strong>GIR:</strong> {calculatedStats.greensInRegulation}/{holes}</Col>
                      <Col xs={6} md={3}><strong>FIR:</strong> {calculatedStats.fairwaysInRegulation}</Col>
                      <Col xs={6} md={3}><strong>Up & Down:</strong> {calculatedStats.upAndDowns}/{calculatedStats.upAndDownAttempts}</Col>
                      <Col xs={6} md={3}><strong>GIR Putts:</strong> {calculatedStats.girPutts}</Col>
                      <Col xs={6} md={3}><strong>Non-GIR Putts:</strong> {calculatedStats.nonGirPutts}</Col>
                      <Col xs={6} md={3}><strong>Par or Better:</strong> {calculatedStats.parOrBetter}</Col>
                    </Row>
                  </Alert>
                )}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Notes */}
        <Card className="mb-4">
          <Card.Body>
            <Form.Group>
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this round... (conditions, highlights, things to work on)"
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            size="lg"
          >
            {loading ? 'Saving...' : 'Save Round'}
          </Button>
          <Link href="/rounds" className="btn btn-outline-secondary btn-lg">
            Cancel
          </Link>
        </div>
      </Form>
    </Container>
  )
}
