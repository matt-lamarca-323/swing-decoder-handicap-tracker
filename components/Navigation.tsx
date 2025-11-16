'use client'

import { Navbar, Nav, Container, NavDropdown, Image, Button } from 'react-bootstrap'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useAdminMode } from '@/contexts/AdminModeContext'
import { useEffect } from 'react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const { adminMode, toggleAdminMode, setIsAdmin } = useAdminMode()

  // Update isAdmin state when session changes
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }
  }, [session, setIsAdmin])

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Link href="/" passHref legacyBehavior>
          <Navbar.Brand>
            <Image
              src="/logo-thin.png"
              alt="Swing Decoder Handicap Tracker"
              height={40}
              className="d-inline-block"
            />
          </Navbar.Brand>
        </Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {session ? (
              <>
                <Link href="/dashboard" passHref legacyBehavior>
                  <Nav.Link>Dashboard</Nav.Link>
                </Link>
                {session.user?.role === 'ADMIN' && adminMode && (
                  <Link href="/users" passHref legacyBehavior>
                    <Nav.Link>Users</Nav.Link>
                  </Link>
                )}
                <Link href="/rounds" passHref legacyBehavior>
                  <Nav.Link>Rounds</Nav.Link>
                </Link>
                <Link href="/stats" passHref legacyBehavior>
                  <Nav.Link>Stats</Nav.Link>
                </Link>
              </>
            ) : (
              <Link href="/" passHref legacyBehavior>
                <Nav.Link>Home</Nav.Link>
              </Link>
            )}
          </Nav>
          {session?.user?.role === 'ADMIN' && (
            <Nav className="ms-2">
              <Button
                variant={adminMode ? 'warning' : 'outline-warning'}
                size="sm"
                onClick={toggleAdminMode}
              >
                {adminMode ? 'Admin Mode' : 'Standard Mode'}
              </Button>
            </Nav>
          )}
          <Nav className="ms-3">
            {isLoading ? (
              <Nav.Link disabled>Loading...</Nav.Link>
            ) : session ? (
              <NavDropdown
                title={
                  <span>
                    {session.user?.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || 'User'}
                        roundedCircle
                        width={30}
                        height={30}
                        className="me-2"
                      />
                    )}
                    {session.user?.name}
                    {session.user?.role === 'ADMIN' && (
                      <span className="badge bg-warning text-dark ms-2">Admin</span>
                    )}
                  </span>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item disabled>
                  Signed in as {session.user?.email}
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => signOut()}>
                  Sign Out
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button variant="outline-light" onClick={() => signIn('google')}>
                Sign In
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
