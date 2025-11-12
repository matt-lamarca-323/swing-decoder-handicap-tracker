import Link from 'next/link'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'

export default function Home() {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="text-center">
            <Card.Body className="p-5">
              <h1 className="mb-4">Swing Decoder Handicap Tracker</h1>
              <p className="lead mb-4">
                Track your golf handicap and analyze your swing performance
              </p>
              <Link href="/users" passHref legacyBehavior>
                <Button variant="primary" size="lg">
                  Manage Users
                </Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
