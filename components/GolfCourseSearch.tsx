'use client'

import { useState, useEffect, useRef } from 'react'
import { Form, ListGroup, Spinner, Alert } from 'react-bootstrap'
import type { GolfCourseSearchResult, GolfCourseDetails, GolfCourseTee } from '@/types/golf-course'

interface GolfCourseSearchProps {
  onCourseSelect: (course: GolfCourseDetails, tee: GolfCourseTee) => void
  disabled?: boolean
  initialValue?: string
}

export default function GolfCourseSearch({ onCourseSelect, disabled = false, initialValue = '' }: GolfCourseSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const [searchResults, setSearchResults] = useState<GolfCourseSearchResult[]>([])
  const [selectedCourse, setSelectedCourse] = useState<GolfCourseDetails | null>(null)
  const [selectedTee, setSelectedTee] = useState<GolfCourseTee | null>(null)
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/golf-courses/search?query=${encodeURIComponent(searchQuery)}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to search courses')
        }

        const data = await response.json()
        setSearchResults(data.courses || [])
        setShowResults(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search courses')
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }, 500) // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleCourseSelect = async (course: GolfCourseSearchResult) => {
    setLoading(true)
    setError(null)
    setShowResults(false)

    try {
      // Fetch full course details
      const response = await fetch(`/api/golf-courses/${course.id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch course details')
      }

      const courseDetails: GolfCourseDetails = await response.json()

      // Debug: Log the course details to see the structure
      console.log('Course Details:', courseDetails)
      console.log('Tees:', courseDetails.tees)
      console.log('Male Tees:', courseDetails.tees?.male)
      console.log('Female Tees:', courseDetails.tees?.female)

      setSelectedCourse(courseDetails)
      setSearchQuery(`${courseDetails.club_name} - ${courseDetails.course_name}`)

      // Auto-select first tee if available
      const availableTees = courseDetails.tees?.[selectedGender]
      if (availableTees && availableTees.length > 0) {
        setSelectedTee(availableTees[0])
      } else {
        setError(`No ${selectedGender} tees available for this course. Try switching gender or select a different course.`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  const handleTeeSelect = (tee: GolfCourseTee) => {
    setSelectedTee(tee)
  }

  const handleGenderChange = (gender: 'male' | 'female') => {
    setSelectedGender(gender)
    setSelectedTee(null)

    // Auto-select first tee for new gender
    if (selectedCourse) {
      const availableTees = selectedCourse.tees?.[gender]
      if (availableTees && availableTees.length > 0) {
        setSelectedTee(availableTees[0])
      }
    }
  }

  // Trigger callback when tee is selected
  useEffect(() => {
    if (selectedCourse && selectedTee) {
      onCourseSelect(selectedCourse, selectedTee)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTee, selectedCourse])

  return (
    <div>
      {/* Course Search Input */}
      <Form.Group className="mb-3 position-relative">
        <Form.Label>Search Golf Course</Form.Label>
        <div className="position-relative">
          <Form.Control
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course or club name..."
            disabled={disabled || loading}
          />
          {loading && (
            <Spinner
              animation="border"
              size="sm"
              className="position-absolute top-50 end-0 translate-middle-y me-2"
            />
          )}
        </div>
        <Form.Text className="text-muted">
          Type at least 3 characters to search
        </Form.Text>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <ListGroup className="position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
            {searchResults.map((course) => (
              <ListGroup.Item
                key={course.id}
                action
                onClick={() => handleCourseSelect(course)}
                className="cursor-pointer"
              >
                <div className="fw-bold">{course.club_name}</div>
                {course.course_name && <div className="small">{course.course_name}</div>}
                <div className="small text-muted">{course.location.address}</div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        {showResults && searchResults.length === 0 && !loading && (
          <Alert variant="info" className="mt-2 mb-0">
            No courses found. Try a different search term.
          </Alert>
        )}
      </Form.Group>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      {/* Debug Info */}
      {selectedCourse && !selectedCourse.tees && (
        <Alert variant="warning" className="mb-3">
          Course data loaded but no tee information available. The API response may not include tees.
        </Alert>
      )}

      {/* Gender Selection */}
      {selectedCourse && (
        <Form.Group className="mb-3">
          <Form.Label>Gender</Form.Label>
          <div>
            <Form.Check
              inline
              type="radio"
              label="Male Tees"
              name="gender"
              id="male"
              checked={selectedGender === 'male'}
              onChange={() => handleGenderChange('male')}
              disabled={disabled}
            />
            <Form.Check
              inline
              type="radio"
              label="Female Tees"
              name="gender"
              id="female"
              checked={selectedGender === 'female'}
              onChange={() => handleGenderChange('female')}
              disabled={disabled}
            />
          </div>
        </Form.Group>
      )}

      {/* Tee Selection */}
      {selectedCourse && selectedCourse.tees?.[selectedGender] && selectedCourse.tees[selectedGender].length > 0 && (
        <Form.Group className="mb-3">
          <Form.Label>Select Tee</Form.Label>
          <Form.Select
            value={selectedTee?.tee_name || ''}
            onChange={(e) => {
              const tee = selectedCourse.tees?.[selectedGender]?.find(t => t.tee_name === e.target.value)
              if (tee) handleTeeSelect(tee)
            }}
            disabled={disabled}
          >
            <option value="">Choose tee...</option>
            {selectedCourse.tees[selectedGender]?.map((tee) => (
              <option key={tee.tee_name} value={tee.tee_name}>
                {tee.tee_name} - {tee.total_yards} yards (Rating: {tee.course_rating}, Slope: {tee.slope_rating})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}

      {/* Selected Course Info */}
      {selectedCourse && selectedTee && (
        <Alert variant="success">
          <strong>Selected:</strong> {selectedCourse.club_name} - {selectedCourse.course_name}<br />
          <strong>Tee:</strong> {selectedTee.tee_name} ({selectedGender})<br />
          <strong>Rating:</strong> {selectedTee.course_rating} | <strong>Slope:</strong> {selectedTee.slope_rating}<br />
          <strong>Par:</strong> {selectedTee.par_total} | <strong>Yardage:</strong> {selectedTee.total_yards} yards
        </Alert>
      )}
    </div>
  )
}
