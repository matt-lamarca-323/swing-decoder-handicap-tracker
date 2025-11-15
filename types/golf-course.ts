/**
 * Golf Course API type definitions
 * Based on golfcourseapi.com API v1.0.0
 */

export interface GolfCourseSearchResult {
  id: number
  club_name: string
  course_name: string
  location: {
    address: string
  }
}

export interface GolfCourseLocation {
  address: string
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export interface GolfCourseHole {
  par: number
  yardage: number
  handicap: number
}

export interface GolfCourseTee {
  tee_name: string
  course_rating: number
  slope_rating: number
  bogey_rating: number
  total_yards: number
  total_meters: number
  number_of_holes: number
  par_total: number
  front_course_rating: number
  front_slope_rating: number
  front_bogey_rating: number
  back_course_rating: number
  back_slope_rating: number
  back_bogey_rating: number
  holes: GolfCourseHole[]
}

export interface GolfCourseDetails {
  id: number
  club_name: string
  course_name: string
  location: GolfCourseLocation
  tees: {
    female: GolfCourseTee[]
    male: GolfCourseTee[]
  }
}

export interface GolfCourseSearchResponse {
  courses: GolfCourseSearchResult[]
}
