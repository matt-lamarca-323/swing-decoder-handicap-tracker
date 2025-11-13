'use client'

import { useState } from 'react'
import { Container, Card, Button, Form, Alert } from 'react-bootstrap'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [resetUrl, setResetUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    setResetUrl('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to process request')
        setLoading(false)
        return
      }

      setSuccessMessage(data.message)

      // In development, show the reset URL
      if (data.resetUrl) {
        setResetUrl(data.resetUrl)
      }

      // Clear the email field
      setEmail('')
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
            <h1 className="h3 mb-2">Forgot Password</h1>
            <p className="text-muted">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {errorMessage && (
            <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <p className="mb-0">{successMessage}</p>
              {resetUrl && (
                <div className="mt-3">
                  <hr />
                  <p className="mb-2 fw-bold">Development Mode - Reset Link:</p>
                  <div className="bg-light p-3 rounded">
                    <small className="font-monospace text-break">{resetUrl}</small>
                  </div>
                  <p className="mt-2 mb-0 small text-muted">
                    In production, this link would be sent to your email.
                  </p>
                  <Link href={resetUrl} className="btn btn-sm btn-primary mt-2 w-100">
                    Go to Reset Password
                  </Link>
                </div>
              )}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Link href="/auth/signin" className="text-decoration-none">
                Back to Sign In
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  )
}
