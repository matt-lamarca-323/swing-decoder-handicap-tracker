'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Container, Card, Button, Form, Alert } from 'react-bootstrap'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/users'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please try again.'
      case 'OAuthSignin':
      case 'OAuthCallback':
        return 'Error signing in with Google. Please try again.'
      case 'OAuthAccountNotLinked':
        return 'This email is already registered. Please sign in with your password.'
      default:
        return error ? 'An error occurred during sign in. Please try again.' : ''
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        rememberMe: rememberMe.toString(),
        redirect: false,
      })

      if (result?.error) {
        setErrorMessage('Invalid email or password')
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl })
  }

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card style={{ maxWidth: '450px', width: '100%' }}>
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <h1 className="h3 mb-2">Welcome Back</h1>
            <p className="text-muted">Sign in to access your golf handicap tracker</p>
          </div>

          {(error || errorMessage) && (
            <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
              {errorMessage || getErrorMessage(error)}
            </Alert>
          )}

          {/* Email/Password Form */}
          <Form onSubmit={handleEmailSignIn} className="mb-4">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Check
                type="checkbox"
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <Link href="/auth/forgot-password" className="text-decoration-none small">
                Forgot password?
              </Link>
            </div>

            <Button
              variant="primary"
              type="submit"
              size="lg"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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

          {/* Google Sign In */}
          <Button
            variant="outline-dark"
            size="lg"
            onClick={handleGoogleSignIn}
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

          {/* Sign Up Link */}
          <div className="text-center mt-4">
            <span className="text-muted">Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="text-decoration-none">
              Sign up
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}
