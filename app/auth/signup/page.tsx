'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Container, Card, Button, Form, Alert } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
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

    try {
      // Call sign-up API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      // Account created successfully, show success message
      setSuccessMessage('Account created successfully! Signing you in...')

      // Automatically sign in the user
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setErrorMessage('Account created but sign-in failed. Please sign in manually.')
        setTimeout(() => router.push('/auth/signin'), 2000)
      } else if (signInResult?.ok) {
        // Redirect to users page after successful sign in
        router.push('/users')
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/users' })
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card style={{ maxWidth: '450px', width: '100%' }}>
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h1 className="h3 mb-2">Create Account</h1>
            <p className="text-muted">Sign up to start tracking your golf handicap</p>
          </div>

          {errorMessage && (
            <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">{successMessage}</Alert>
          )}

          {/* Email/Password Form */}
          <Form onSubmit={handleSignUp} className="mb-4">
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Create a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm your password"
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
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </Form>

          {/* Divider */}
          <div className="text-center my-3 position-relative">
            <hr />
            <span
              className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted"
              style={{ fontSize: '0.875rem' }}
            >
              OR
            </span>
          </div>

          {/* Google Sign Up */}
          <Button
            variant="outline-dark"
            size="lg"
            onClick={handleGoogleSignUp}
            className="w-100 d-flex align-items-center justify-content-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="currentColor"
              className="me-2"
              viewBox="0 0 16 16"
            >
              <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Sign In Link */}
          <div className="text-center mt-4">
            <span className="text-muted">Already have an account? </span>
            <Link href="/auth/signin" className="text-decoration-none">
              Sign in
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}
