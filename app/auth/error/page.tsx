'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap'
import Link from 'next/link'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          message: 'There is a problem with the server configuration.',
          details: 'This usually means AUTH_SECRET is missing or invalid. Please check environment variables.',
          troubleshooting: [
            'Verify AUTH_SECRET is set in environment variables',
            'Ensure DATABASE_URL is configured correctly',
            'Check that all required OAuth credentials are set'
          ]
        }
      case 'AccessDenied':
        return {
          message: 'You do not have permission to sign in.',
          details: 'Access to this application has been denied.',
          troubleshooting: ['Contact an administrator for access']
        }
      case 'Verification':
        return {
          message: 'The verification token has expired or has already been used.',
          details: null,
          troubleshooting: ['Request a new verification email']
        }
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return {
          message: 'There was an error during the sign-in process.',
          details: `Error type: ${error}`,
          troubleshooting: [
            'Try signing in again',
            'Clear your browser cookies and cache',
            'Try a different browser'
          ]
        }
      case 'OAuthAccountNotLinked':
        return {
          message: 'This email is already associated with another account.',
          details: 'You cannot link multiple OAuth providers to the same email.',
          troubleshooting: ['Sign in with your original authentication method']
        }
      case 'EmailSignin':
        return {
          message: 'The email could not be sent.',
          details: null,
          troubleshooting: ['Check your email address and try again']
        }
      case 'CredentialsSignin':
        return {
          message: 'Sign in failed. Check the details you provided are correct.',
          details: null,
          troubleshooting: ['Verify your email and password', 'Reset your password if needed']
        }
      case 'SessionRequired':
        return {
          message: 'Please sign in to access this page.',
          details: null,
          troubleshooting: ['Sign in to continue']
        }
      default:
        return {
          message: 'An unexpected error occurred during authentication.',
          details: error ? `Error code: ${error}` : null,
          troubleshooting: ['Try signing in again', 'Contact support if the issue persists']
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Card style={{ maxWidth: '600px', width: '100%' }}>
        <Card.Body className="p-5">
          <h1 className="h3 mb-4">Authentication Error</h1>

          <Alert variant="danger">
            <Alert.Heading className="h5">{errorInfo.message}</Alert.Heading>
            {errorInfo.details && (
              <p className="mb-0 mt-2">
                <small>{errorInfo.details}</small>
              </p>
            )}
          </Alert>

          {errorInfo.troubleshooting && errorInfo.troubleshooting.length > 0 && (
            <div className="mb-4">
              <h6 className="text-muted">Troubleshooting Steps:</h6>
              <ul className="text-muted">
                {errorInfo.troubleshooting.map((step, index) => (
                  <li key={index}><small>{step}</small></li>
                ))}
              </ul>
            </div>
          )}

          <div className="d-grid gap-2">
            <Link href="/auth/signin" passHref>
              <Button variant="primary" size="lg">
                Try Again
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button variant="outline-secondary">
                Go Home
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
