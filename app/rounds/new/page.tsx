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
  calculateUnderGIR,
  calculateUpAndDown,
  STANDARD_PARS
} from '@/lib/golf-calculator'
import GolfCourseSearch from '@/components/GolfCourseSearch'
import type { GolfCourseDetails, GolfCourseTee } from '@/types/golf-course'

export default function NewRoundPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entryMode, setEntryMode] = useState<'simple' | 'detailed'>('simple')

  // Two-step workflow state
  const [roundInfoSubmitted, setRoundInfoSubmitted] = useState(false)

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

  const handleRoundInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate round information
    if (!courseName || !datePlayed) {
      setError('Please fill in all required round information fields')
      return
    }
    setError(null)
    setRoundInfoSubmitted(true)
    // Regenerate hole data if holes changed
    if (entryMode === 'detailed') {
      setHoleData(generateDefaultHoles(holes))
    }
  }

  const handleEditRoundInfo = () => {
    setRoundInfoSubmitted(false)
  }

  const handleCourseSelect = (course: GolfCourseDetails, tee: GolfCourseTee) => {
    // Set course name
    setCourseName(`${course.club_name} - ${course.course_name}`)

    // Set course and slope ratings
    setCourseRating(tee.course_rating)
    setSlopeRating(tee.slope_rating)

    // Set number of holes
    setHoles(tee.number_of_holes)

    // Auto-populate hole data with par, yardage, and handicap
    if (entryMode === 'detailed') {
      const newHoleData = tee.holes.map((hole, index) => ({
        holeNumber: index + 1,
        par: hole.par,
        score: 0,
        putts: 0,
        fairwayHit: undefined,
        yardage: hole.yardage,
        handicap: hole.handicap
      }))
      setHoleData(newHoleData)
    }
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

      {/* Step 1: Round Information */}
      <Form onSubmit={roundInfoSubmitted ? handleSubmit : handleRoundInfoSubmit}>
        <Card className="mb-4">
          <Card.Header className={roundInfoSubmitted ? "bg-success text-white" : "bg-primary text-white"}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {roundInfoSubmitted ? "✓ " : ""}Round Information
              </h5>
              {roundInfoSubmitted && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleEditRoundInfo}
                  type="button"
                >
                  Edit
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            {/* Golf Course Search */}
            <div className="mb-4">
              <GolfCourseSearch
                onCourseSelect={handleCourseSelect}
                disabled={roundInfoSubmitted}
                initialValue={courseName}
              />
            </div>

            <div className="text-center text-muted mb-3">
              <small>— OR enter manually —</small>
            </div>

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
                    disabled={roundInfoSubmitted}
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
                    disabled={roundInfoSubmitted}
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
                    disabled={roundInfoSubmitted}
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
                    disabled={roundInfoSubmitted}
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
                    disabled={roundInfoSubmitted}
                  />
                </Form.Group>
              </Col>
            </Row>

            {!roundInfoSubmitted && (
              <div className="d-flex justify-content-end mt-3">
                <Button variant="primary" type="submit" size="lg">
                  Continue to Score Entry →
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Step 2: Score Entry - Only shown after Round Info is submitted */}
        {roundInfoSubmitted && (
          <>
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
                {/* Front 9 Scorecard */}
                <div className="mb-4">
                  <h6 className="text-muted mb-2">Front 9</h6>
                  <div className="table-responsive">
                    <Table bordered size="sm" className="scorecard-table text-center">
                      <thead className="table-light">
                        <tr>
                          <th style={{width: '80px'}}></th>
                          {holeData.slice(0, Math.min(9, holes)).map((hole) => (
                            <th key={`h-${hole.holeNumber}`} className="text-center fw-bold" style={{minWidth: '60px'}}>
                              {hole.holeNumber}
                            </th>
                          ))}
                          <th className="text-center bg-warning fw-bold" style={{minWidth: '60px'}}>FRONT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Par Row */}
                        <tr>
                          <td className="fw-bold bg-light">Par</td>
                          {holeData.slice(0, Math.min(9, holes)).map((hole, index) => (
                            <td key={`par-${hole.holeNumber}`}>
                              <Form.Control
                                type="number"
                                size="sm"
                                min={3}
                                max={6}
                                value={hole.par}
                                onChange={(e) => handleHoleChange(index, 'par', Number(e.target.value))}
                                className="text-center"
                              />
                            </td>
                          ))}
                          <td className="fw-bold bg-warning">
                            {holeData.slice(0, Math.min(9, holes)).reduce((sum, h) => sum + h.par, 0)}
                          </td>
                        </tr>

                        {/* Score Row */}
                        <tr>
                          <td className="fw-bold bg-light">Score *</td>
                          {holeData.slice(0, Math.min(9, holes)).map((hole, index) => (
                            <td key={`score-${hole.holeNumber}`}>
                              <Form.Control
                                type="number"
                                size="sm"
                                min={1}
                                value={hole.score || ''}
                                onChange={(e) => handleHoleChange(index, 'score', Number(e.target.value))}
                                placeholder="-"
                                className="text-center"
                              />
                            </td>
                          ))}
                          <td className="fw-bold bg-warning">
                            {holeData.slice(0, Math.min(9, holes)).reduce((sum, h) => sum + (h.score || 0), 0) || '-'}
                          </td>
                        </tr>

                        {/* Putts Row */}
                        <tr>
                          <td className="fw-bold bg-light">Putts *</td>
                          {holeData.slice(0, Math.min(9, holes)).map((hole, index) => (
                            <td key={`putts-${hole.holeNumber}`}>
                              <Form.Control
                                type="number"
                                size="sm"
                                min={0}
                                value={hole.putts || ''}
                                onChange={(e) => handleHoleChange(index, 'putts', Number(e.target.value))}
                                placeholder="-"
                                className="text-center"
                              />
                            </td>
                          ))}
                          <td className="fw-bold bg-warning">
                            {holeData.slice(0, Math.min(9, holes)).reduce((sum, h) => sum + (h.putts || 0), 0) || '-'}
                          </td>
                        </tr>

                        {/* Fairway Row */}
                        <tr>
                          <td className="fw-bold bg-light">Fairway</td>
                          {holeData.slice(0, Math.min(9, holes)).map((hole, index) => (
                            <td key={`fw-${hole.holeNumber}`}>
                              {hole.par > 3 ? (
                                <Form.Select
                                  size="sm"
                                  value={hole.fairwayHit === undefined ? '' : hole.fairwayHit ? 'true' : 'false'}
                                  onChange={(e) => handleHoleChange(index, 'fairwayHit', e.target.value === '' ? undefined : e.target.value === 'true')}
                                  className="text-center"
                                >
                                  <option value="">-</option>
                                  <option value="true">✓</option>
                                  <option value="false">✗</option>
                                </Form.Select>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          ))}
                          <td className="fw-bold bg-warning">
                            {(() => {
                              const front9 = holeData.slice(0, Math.min(9, holes))
                              const firHit = front9.filter(h => h.par > 3 && h.fairwayHit === true).length
                              const firTotal = front9.filter(h => h.par > 3).length
                              if (firTotal === 0) return '-'
                              const firPct = ((firHit / firTotal) * 100).toFixed(0)
                              return `${firHit}/${firTotal} (${firPct}%)`
                            })()}
                          </td>
                        </tr>

                        {/* GIR Row */}
                        <tr>
                          <td className="fw-bold bg-light">GIR</td>
                          {holeData.slice(0, Math.min(9, holes)).map((hole) => {
                            const hasValidData = hole.score > 0 && hole.putts >= 0
                            const hitGIR = hasValidData ? calculateGIR(hole.par, hole.score, hole.putts) : false
                            return (
                              <td key={`gir-${hole.holeNumber}`}>
                                {hasValidData && (
                                  <span className={hitGIR ? 'text-success fw-bold' : 'text-muted'}>
                                    {hitGIR ? '✓' : '✗'}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          <td className="fw-bold bg-warning">
                            {(() => {
                              const front9 = holeData.slice(0, Math.min(9, holes))
                              const girHit = front9.filter(h => {
                                const hasValidData = h.score > 0 && h.putts >= 0
                                return hasValidData && calculateGIR(h.par, h.score, h.putts)
                              }).length
                              const girTotal = front9.length
                              const girPct = ((girHit / girTotal) * 100).toFixed(0)
                              return `${girHit}/${girTotal} (${girPct}%)`
                            })()}
                          </td>
                        </tr>

                        {/* Under GIR Row */}
                        <tr>
                          <td className="fw-bold bg-light">Under GIR</td>
                          {holeData.slice(0, Math.min(9, holes)).map((hole) => {
                            const hasValidData = hole.score > 0 && hole.putts >= 0
                            const hitUnderGIR = hasValidData ? calculateUnderGIR(hole.par, hole.score, hole.putts) : false
                            return (
                              <td key={`undergir-${hole.holeNumber}`}>
                                {hasValidData && (
                                  <span className={hitUnderGIR ? 'text-primary fw-bold' : 'text-muted'}>
                                    {hitUnderGIR ? '⭐' : '—'}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          <td className="fw-bold bg-warning">
                            {(() => {
                              const front9 = holeData.slice(0, Math.min(9, holes))
                              const underGIRHit = front9.filter(h => {
                                const hasValidData = h.score > 0 && h.putts >= 0
                                return hasValidData && calculateUnderGIR(h.par, h.score, h.putts)
                              }).length
                              const underGIRTotal = front9.filter(h => h.par > 3).length
                              if (underGIRTotal === 0) return '-'
                              const underGIRPct = ((underGIRHit / underGIRTotal) * 100).toFixed(0)
                              return `${underGIRHit}/${underGIRTotal} (${underGIRPct}%)`
                            })()}
                          </td>
                        </tr>

                        {/* Par Save Row */}
                        <tr>
                          <td className="fw-bold bg-light">Par Save</td>
                          {holeData.slice(0, Math.min(9, holes)).map((hole) => {
                            const hasValidData = hole.score > 0 && hole.putts >= 0
                            const hitGIR = hasValidData ? calculateGIR(hole.par, hole.score, hole.putts) : false
                            const upDownResult = hasValidData ? calculateUpAndDown(hole.par, hole.score, hole.putts, hitGIR) : { isAttempt: false, isSuccess: false }
                            return (
                              <td key={`ud-${hole.holeNumber}`}>
                                {hasValidData && upDownResult.isAttempt && (
                                  <span className={upDownResult.isSuccess ? 'text-success fw-bold' : 'text-danger'}>
                                    {upDownResult.isSuccess ? '✓' : '✗'}
                                  </span>
                                )}
                                {hasValidData && !upDownResult.isAttempt && (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="fw-bold bg-warning">
                            {(() => {
                              const front9 = holeData.slice(0, Math.min(9, holes))
                              const parSaves = front9.filter(h => {
                                const hasValidData = h.score > 0 && h.putts >= 0
                                if (!hasValidData) return false
                                const hitGIR = calculateGIR(h.par, h.score, h.putts)
                                const upDownResult = calculateUpAndDown(h.par, h.score, h.putts, hitGIR)
                                return upDownResult.isAttempt && upDownResult.isSuccess
                              }).length
                              const parSaveAttempts = front9.filter(h => {
                                const hasValidData = h.score > 0 && h.putts >= 0
                                if (!hasValidData) return false
                                const hitGIR = calculateGIR(h.par, h.score, h.putts)
                                const upDownResult = calculateUpAndDown(h.par, h.score, h.putts, hitGIR)
                                return upDownResult.isAttempt
                              }).length
                              if (parSaveAttempts === 0) return '-'
                              const parSavePct = ((parSaves / parSaveAttempts) * 100).toFixed(0)
                              return `${parSaves}/${parSaveAttempts} (${parSavePct}%)`
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </div>

                {/* Back 9 Scorecard */}
                {holes === 18 && (
                  <div className="mb-4">
                    <h6 className="text-muted mb-2">Back 9</h6>
                    <div className="table-responsive">
                      <Table bordered size="sm" className="scorecard-table text-center">
                        <thead className="table-light">
                          <tr>
                            <th style={{width: '80px'}}></th>
                            {holeData.slice(9, 18).map((hole) => (
                              <th key={`h-${hole.holeNumber}`} className="text-center fw-bold" style={{minWidth: '60px'}}>
                                {hole.holeNumber}
                              </th>
                            ))}
                            <th className="text-center bg-warning fw-bold" style={{minWidth: '60px'}}>BACK</th>
                            <th className="text-center bg-success fw-bold" style={{minWidth: '70px'}}>TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Par Row */}
                          <tr>
                            <td className="fw-bold bg-light">Par</td>
                            {holeData.slice(9, 18).map((hole, index) => {
                              const actualIndex = index + 9
                              return (
                                <td key={`par-${hole.holeNumber}`}>
                                  <Form.Control
                                    type="number"
                                    size="sm"
                                    min={3}
                                    max={6}
                                    value={hole.par}
                                    onChange={(e) => handleHoleChange(actualIndex, 'par', Number(e.target.value))}
                                    className="text-center"
                                  />
                                </td>
                              )
                            })}
                            <td className="fw-bold bg-warning">
                              {holeData.slice(9, 18).reduce((sum, h) => sum + h.par, 0)}
                            </td>
                            <td className="fw-bold bg-success">
                              {holeData.slice(0, 18).reduce((sum, h) => sum + h.par, 0)}
                            </td>
                          </tr>

                          {/* Score Row */}
                          <tr>
                            <td className="fw-bold bg-light">Score *</td>
                            {holeData.slice(9, 18).map((hole, index) => {
                              const actualIndex = index + 9
                              return (
                                <td key={`score-${hole.holeNumber}`}>
                                  <Form.Control
                                    type="number"
                                    size="sm"
                                    min={1}
                                    value={hole.score || ''}
                                    onChange={(e) => handleHoleChange(actualIndex, 'score', Number(e.target.value))}
                                    placeholder="-"
                                    className="text-center"
                                  />
                                </td>
                              )
                            })}
                            <td className="fw-bold bg-warning">
                              {holeData.slice(9, 18).reduce((sum, h) => sum + (h.score || 0), 0) || '-'}
                            </td>
                            <td className="fw-bold bg-success">
                              {holeData.slice(0, 18).reduce((sum, h) => sum + (h.score || 0), 0) || '-'}
                            </td>
                          </tr>

                          {/* Putts Row */}
                          <tr>
                            <td className="fw-bold bg-light">Putts *</td>
                            {holeData.slice(9, 18).map((hole, index) => {
                              const actualIndex = index + 9
                              return (
                                <td key={`putts-${hole.holeNumber}`}>
                                  <Form.Control
                                    type="number"
                                    size="sm"
                                    min={0}
                                    value={hole.putts || ''}
                                    onChange={(e) => handleHoleChange(actualIndex, 'putts', Number(e.target.value))}
                                    placeholder="-"
                                    className="text-center"
                                  />
                                </td>
                              )
                            })}
                            <td className="fw-bold bg-warning">
                              {holeData.slice(9, 18).reduce((sum, h) => sum + (h.putts || 0), 0) || '-'}
                            </td>
                            <td className="fw-bold bg-success">
                              {holeData.slice(0, 18).reduce((sum, h) => sum + (h.putts || 0), 0) || '-'}
                            </td>
                          </tr>

                          {/* Fairway Row */}
                          <tr>
                            <td className="fw-bold bg-light">Fairway</td>
                            {holeData.slice(9, 18).map((hole, index) => {
                              const actualIndex = index + 9
                              return (
                                <td key={`fw-${hole.holeNumber}`}>
                                  {hole.par > 3 ? (
                                    <Form.Select
                                      size="sm"
                                      value={hole.fairwayHit === undefined ? '' : hole.fairwayHit ? 'true' : 'false'}
                                      onChange={(e) => handleHoleChange(actualIndex, 'fairwayHit', e.target.value === '' ? undefined : e.target.value === 'true')}
                                      className="text-center"
                                    >
                                      <option value="">-</option>
                                      <option value="true">✓</option>
                                      <option value="false">✗</option>
                                    </Form.Select>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="fw-bold bg-warning">
                              {(() => {
                                const back9 = holeData.slice(9, 18)
                                const firHit = back9.filter(h => h.par > 3 && h.fairwayHit === true).length
                                const firTotal = back9.filter(h => h.par > 3).length
                                if (firTotal === 0) return '-'
                                const firPct = ((firHit / firTotal) * 100).toFixed(0)
                                return `${firHit}/${firTotal} (${firPct}%)`
                              })()}
                            </td>
                            <td className="fw-bold bg-success">
                              {(() => {
                                const allHoles = holeData.slice(0, 18)
                                const firHit = allHoles.filter(h => h.par > 3 && h.fairwayHit === true).length
                                const firTotal = allHoles.filter(h => h.par > 3).length
                                if (firTotal === 0) return '-'
                                const firPct = ((firHit / firTotal) * 100).toFixed(0)
                                return `${firHit}/${firTotal} (${firPct}%)`
                              })()}
                            </td>
                          </tr>

                          {/* GIR Row */}
                          <tr>
                            <td className="fw-bold bg-light">GIR</td>
                            {holeData.slice(9, 18).map((hole) => {
                              const hasValidData = hole.score > 0 && hole.putts >= 0
                              const hitGIR = hasValidData ? calculateGIR(hole.par, hole.score, hole.putts) : false
                              return (
                                <td key={`gir-${hole.holeNumber}`}>
                                  {hasValidData && (
                                    <span className={hitGIR ? 'text-success fw-bold' : 'text-muted'}>
                                      {hitGIR ? '✓' : '✗'}
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="fw-bold bg-warning">
                              {(() => {
                                const back9 = holeData.slice(9, 18)
                                const girHit = back9.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  return hasValidData && calculateGIR(h.par, h.score, h.putts)
                                }).length
                                const girTotal = back9.length
                                const girPct = ((girHit / girTotal) * 100).toFixed(0)
                                return `${girHit}/${girTotal} (${girPct}%)`
                              })()}
                            </td>
                            <td className="fw-bold bg-success">
                              {(() => {
                                const allHoles = holeData.slice(0, 18)
                                const girHit = allHoles.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  return hasValidData && calculateGIR(h.par, h.score, h.putts)
                                }).length
                                const girTotal = allHoles.length
                                const girPct = ((girHit / girTotal) * 100).toFixed(0)
                                return `${girHit}/${girTotal} (${girPct}%)`
                              })()}
                            </td>
                          </tr>

                          {/* Under GIR Row */}
                          <tr>
                            <td className="fw-bold bg-light">Under GIR</td>
                            {holeData.slice(9, 18).map((hole) => {
                              const hasValidData = hole.score > 0 && hole.putts >= 0
                              const hitUnderGIR = hasValidData ? calculateUnderGIR(hole.par, hole.score, hole.putts) : false
                              return (
                                <td key={`undergir-${hole.holeNumber}`}>
                                  {hasValidData && (
                                    <span className={hitUnderGIR ? 'text-primary fw-bold' : 'text-muted'}>
                                      {hitUnderGIR ? '⭐' : '—'}
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="fw-bold bg-warning">
                              {(() => {
                                const back9 = holeData.slice(9, 18)
                                const underGIRHit = back9.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  return hasValidData && calculateUnderGIR(h.par, h.score, h.putts)
                                }).length
                                const underGIRTotal = back9.filter(h => h.par > 3).length
                                if (underGIRTotal === 0) return '-'
                                const underGIRPct = ((underGIRHit / underGIRTotal) * 100).toFixed(0)
                                return `${underGIRHit}/${underGIRTotal} (${underGIRPct}%)`
                              })()}
                            </td>
                            <td className="fw-bold bg-success">
                              {(() => {
                                const allHoles = holeData.slice(0, 18)
                                const underGIRHit = allHoles.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  return hasValidData && calculateUnderGIR(h.par, h.score, h.putts)
                                }).length
                                const underGIRTotal = allHoles.filter(h => h.par > 3).length
                                if (underGIRTotal === 0) return '-'
                                const underGIRPct = ((underGIRHit / underGIRTotal) * 100).toFixed(0)
                                return `${underGIRHit}/${underGIRTotal} (${underGIRPct}%)`
                              })()}
                            </td>
                          </tr>

                          {/* Par Save Row */}
                          <tr>
                            <td className="fw-bold bg-light">Par Save</td>
                            {holeData.slice(9, 18).map((hole) => {
                              const hasValidData = hole.score > 0 && hole.putts >= 0
                              const hitGIR = hasValidData ? calculateGIR(hole.par, hole.score, hole.putts) : false
                              const upDownResult = hasValidData ? calculateUpAndDown(hole.par, hole.score, hole.putts, hitGIR) : { isAttempt: false, isSuccess: false }
                              return (
                                <td key={`ud-${hole.holeNumber}`}>
                                  {hasValidData && upDownResult.isAttempt && (
                                    <span className={upDownResult.isSuccess ? 'text-success fw-bold' : 'text-danger'}>
                                      {upDownResult.isSuccess ? '✓' : '✗'}
                                    </span>
                                  )}
                                  {hasValidData && !upDownResult.isAttempt && (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="fw-bold bg-warning">
                              {(() => {
                                const back9 = holeData.slice(9, 18)
                                const parSaves = back9.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  if (!hasValidData) return false
                                  const hitGIR = calculateGIR(h.par, h.score, h.putts)
                                  const upDownResult = calculateUpAndDown(h.par, h.score, h.putts, hitGIR)
                                  return upDownResult.isAttempt && upDownResult.isSuccess
                                }).length
                                const parSaveAttempts = back9.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  if (!hasValidData) return false
                                  const hitGIR = calculateGIR(h.par, h.score, h.putts)
                                  const upDownResult = calculateUpAndDown(h.par, h.score, h.putts, hitGIR)
                                  return upDownResult.isAttempt
                                }).length
                                if (parSaveAttempts === 0) return '-'
                                const parSavePct = ((parSaves / parSaveAttempts) * 100).toFixed(0)
                                return `${parSaves}/${parSaveAttempts} (${parSavePct}%)`
                              })()}
                            </td>
                            <td className="fw-bold bg-success">
                              {(() => {
                                const allHoles = holeData.slice(0, 18)
                                const parSaves = allHoles.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  if (!hasValidData) return false
                                  const hitGIR = calculateGIR(h.par, h.score, h.putts)
                                  const upDownResult = calculateUpAndDown(h.par, h.score, h.putts, hitGIR)
                                  return upDownResult.isAttempt && upDownResult.isSuccess
                                }).length
                                const parSaveAttempts = allHoles.filter(h => {
                                  const hasValidData = h.score > 0 && h.putts >= 0
                                  if (!hasValidData) return false
                                  const hitGIR = calculateGIR(h.par, h.score, h.putts)
                                  const upDownResult = calculateUpAndDown(h.par, h.score, h.putts, hitGIR)
                                  return upDownResult.isAttempt
                                }).length
                                if (parSaveAttempts === 0) return '-'
                                const parSavePct = ((parSaves / parSaveAttempts) * 100).toFixed(0)
                                return `${parSaves}/${parSaveAttempts} (${parSavePct}%)`
                              })()}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </div>
                  </div>
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
          </>
        )}
      </Form>
    </Container>
  )
}
