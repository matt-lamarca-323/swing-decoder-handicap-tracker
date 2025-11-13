'use client'

import { useState, useEffect, Suspense } from 'react'
import { Container, Card, Button, Form, Alert } from 'react-bootstrap'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setErrorMessage('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (!token) {
      setErrorMessage('Invalid reset link')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to reset password')
        setLoading(false)
        return
      }

      setSuccessMessage(data.message)

      // Redirect to sign in page after 2 seconds
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card style={{ maxWidth: '450px', width: '100%' }}>
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h1 className="h3 mb-2">Reset Password</h1>
            <p className="text-muted">Enter your new password below</p>
          </div>

          {errorMessage && (
            <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <p className="mb-0">{successMessage}</p>
              <p className="mb-0 mt-2 small">Redirecting to sign in page...</p>
            </Alert>
          )}

          {token && !successMessage && (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                size="lg"
                className="w-100 mb-3"
                disabled={loading}
              >
                {loading ? 'Resetting password...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Link href="/auth/signin" className="text-decoration-none">
                  Back to Sign In
                </Link>
              </div>
            </Form>
          )}

          {!token && (
            <div className="text-center">
              <Link href="/auth/forgot-password" className="btn btn-primary">
                Request New Reset Link
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
