import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ICPMeetingCard from '../components/ICPMeetingCard';
import CreditsBadge from '../components/CreditsBadge';
import { FiAlertCircle, FiCalendar, FiCreditCard, FiRefreshCw, FiArrowRight, FiTarget, FiSettings, FiTrendingUp, FiFilter, FiBriefcase, FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi';

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

const ICPAnalysis = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [hasEnrichedMeetings, setHasEnrichedMeetings] = useState(true);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [icpFitMeetings, setIcpFitMeetings] = useState([]);
  const [nonIcpMeetings, setNonIcpMeetings] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [totalNonIcpCount, setTotalNonIcpCount] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [totalAnalyzedCount, setTotalAnalyzedCount] = useState(0);
  const [icpCriteria, setIcpCriteria] = useState(null);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(false);
  // Only show low ICP meetings - no need for filter
  // const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'month'
  const [avgIcpScoreData, setAvgIcpScoreData] = useState({ current: null, change: null });
  
  // ICP Criteria state management
  const [icpAnalysisEnabled, setIcpAnalysisEnabled] = useState(true);
  const [icpCriteriaExpanded, setIcpCriteriaExpanded] = useState(false);
  const [employeeRanges, setEmployeeRanges] = useState([]);
  const [yearsFounded, setYearsFounded] = useState([]);
  const [otherCriteria, setOtherCriteria] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Get current week range
  const getWeekRange = () => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `${formatDate(today)} - ${formatDate(endDate)}, ${today.getFullYear()}`;
  };

  const weekRange = getWeekRange();

  // Fetch total non-ICP count
  const fetchNonIcpCount = async () => {
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

      const response = await fetch(`${apiUrl}/icp/stats/non-icp-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setTotalNonIcpCount(result.non_icp_count || 0);
        setTotalAnalyzedCount(result.total_analyzed || 0);
      }
    } catch (error) {
      console.error('Error fetching non-ICP count:', error);
    }
  };

  // Fetch average ICP score data
  const fetchAverageIcpScore = async () => {
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

      const response = await fetch(`${apiUrl}/icp/stats/average-score`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setAvgIcpScoreData({
          current: result.current_week_avg,
          change: result.percentage_change,
        });
      } else {
        // Fall back to calculating from current meetings if API fails
        const all = [...icpFitMeetings, ...nonIcpMeetings];
        if (all.length > 0) {
          const sum = all.reduce((acc, m) => acc + (m.icpScore?.score || 0), 0);
          const avg = sum / all.length;
          setAvgIcpScoreData({
            current: avg,
            change: null,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching average ICP score:', error);
      // Fall back to calculating from current meetings
      const all = [...icpFitMeetings, ...nonIcpMeetings];
      if (all.length > 0) {
        const sum = all.reduce((acc, m) => acc + (m.icpScore?.score || 0), 0);
        const avg = sum / all.length;
        setAvgIcpScoreData({
          current: avg,
          change: null,
        });
      }
    }
  };

  // TEMPORARY FILLER DATA - COMMENTED OUT FOR FUTURE TESTING
  // const fillerMeetings = [
  //   {
  //     id: 'filler-1',
  //     title: 'Connectd Intro Call',
  //     date: '24 September',
  //     time: '8:30 AM',
  //     company: 'DESIGN UNITED',
  //     platform: 'Google Meet',
  //     attendees: [
  //       { name: 'Natalie Blackshaw', initials: 'NB', jobTitle: 'Creative Director' }
  //     ],
  //     icpScore: { score: 3, maxScore: 15 },
  //     fitsIcp: false,
  //     icpReasons: [],
  //     nonIcpReasons: ['Employee count 1'],
  //     concerns: ['Employee count 1'],
  //     criteriaBreakdown: [],
  //     positiveSignals: [],
  //   },
  //   {
  //     id: 'filler-2',
  //     title: 'Connectd Intro Call',
  //     date: '24 September',
  //     time: '10:15 AM',
  //     company: 'Workmaite Limited',
  //     platform: 'Zoom',
  //     attendees: [
  //       { name: 'Darryll Minton', initials: 'DM', jobTitle: 'Co-Founder' }
  //     ],
  //     icpScore: { score: 2, maxScore: 15 },
  //     fitsIcp: false,
  //     icpReasons: [],
  //     nonIcpReasons: ['Founded in 2025', 'Employee count 1'],
  //     concerns: ['Founded in 2025', 'Employee count 1'],
  //     criteriaBreakdown: [],
  //     positiveSignals: [],
  //   },
  //   {
  //     id: 'filler-3',
  //     title: 'Product Demo',
  //     date: '25 September',
  //     time: '2:00 PM',
  //     company: 'TechStart Inc',
  //     platform: 'Microsoft Teams',
  //     attendees: [
  //       { name: 'Sarah Johnson', initials: 'SJ', jobTitle: 'VP of Sales' }
  //     ],
  //     icpScore: { score: 4, maxScore: 15 },
  //     fitsIcp: false,
  //     icpReasons: [],
  //     nonIcpReasons: ['Employee count 5', 'Founded in 2024'],
  //     concerns: ['Employee count 5', 'Founded in 2024'],
  //     criteriaBreakdown: [],
  //     positiveSignals: [],
  //   },
  // ];

  // Fetch enriched meetings with ICP analysis
  const fetchMeetingsWithICP = async () => {
    setIsLoadingMeetings(true);
    
    // TEMPORARY: Uncomment below to use filler data for testing
    // setNonIcpMeetings(fillerMeetings);
    // setHasEnrichedMeetings(true);
    // setIsLoadingMeetings(false);
    // return;
    
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');
      
      console.log('Fetching meetings with ICP from:', `${apiUrl}/calendar/events?days_ahead=7`);
      
      const response = await fetch(`${apiUrl}/calendar/events?days_ahead=7&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (result.events && result.events.length > 0) {
        // Process meetings to separate ICP fit vs non-fit
        const icpFit = [];
        const nonIcp = [];
        
        result.events.forEach(event => {
          const briefingSource = event.briefing_source;
          if (!briefingSource || !briefingSource.companies) {
            console.log(`Event ${event.event_id} has no briefing_source or companies`);
            return;
          }
          
          // Check if any company in the meeting fits ICP
          let fitsIcp = false;
          let icpReasons = [];
          let nonIcpReasons = [];
          
          Object.entries(briefingSource.companies).forEach(([companyName, companyData]) => {
            console.log(`Checking ICP for company: ${companyName}`);
            const icpAnalysis = companyData.icp_analysis;
            console.log('ICP Analysis:', icpAnalysis);
            if (icpAnalysis) {
              if (icpAnalysis.fits_icp) {
                console.log(`✅ ${companyName} FITS ICP`);
                fitsIcp = true;
                icpReasons = icpAnalysis.icp_fit_reasons || [];
              } else {
                console.log(`❌ ${companyName} does NOT fit ICP`);
                nonIcpReasons = icpAnalysis.icp_non_fit_reasons || [];
              }
            } else {
              console.log(`No ICP analysis found for ${companyName}`);
            }
          });
          
          // Transform to UI format
          const meeting = transformEventToICPMeeting(event, fitsIcp, icpReasons, nonIcpReasons);
          
          console.log(`Event ${event.event}: fitsIcp=${fitsIcp}, icpReasons=${icpReasons}, nonIcpReasons=${nonIcpReasons}`);
          
          if (fitsIcp) {
            icpFit.push(meeting);
          } else if (nonIcpReasons.length > 0) {
            nonIcp.push(meeting);
          }
        });
        
        setIcpFitMeetings(icpFit);
        setNonIcpMeetings(nonIcp);
        setHasEnrichedMeetings(true);
      } else {
        setHasEnrichedMeetings(false);
        // TEMPORARY: Uncomment below to use filler data if no real meetings
        // setNonIcpMeetings(fillerMeetings);
        // setHasEnrichedMeetings(true);
      }
    } catch (error) {
      console.error('Error fetching meetings with ICP:', error);
      console.error('Error details:', error.message);
      setErrorMessage(`Failed to load meetings: ${error.message}`);
      // TEMPORARY: Uncomment below to use filler data on error
      // setNonIcpMeetings(fillerMeetings);
      // setHasEnrichedMeetings(true);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const transformEventToICPMeeting = (event, fitsIcp, icpReasons, nonIcpReasons) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const duration = Math.round((endDate - startDate) / (1000 * 60)); // minutes
    
    // Get user email from event (organizer email)
    const userEmail = event.email || '';
    const userEmailLower = userEmail?.toLowerCase() || '';
    
    // Extract attendees - using same approach as Meetings page
    const extractAttendees = (attendeesValue, userEmail) => {
      if (!attendeesValue || attendeesValue === 'No Attendees') {
        return [];
      }
      const userEmailLower = userEmail?.toLowerCase() || '';
      
      if (Array.isArray(attendeesValue)) {
        return attendeesValue
          .map(item => {
            if (typeof item === 'string') {
              return item.replace(/\s*\(.+?\)$/, '').trim();
            } else if (item && typeof item === 'object') {
              return item.name || item.email || '';
            }
            return '';
          })
          .filter(Boolean)
          .filter(item => {
            // Extract email from string if present
            const emailMatch = item.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            const itemEmail = emailMatch ? emailMatch[0].toLowerCase() : item.toLowerCase();
            // Filter out the user's email
            return itemEmail !== userEmailLower;
          });
      }
      if (typeof attendeesValue === 'string') {
        return attendeesValue
          .split(';')
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => item.replace(/\s*\(.+?\)$/, ''))
          .filter(item => {
            // Extract email from string if present
            const emailMatch = item.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            const itemEmail = emailMatch ? emailMatch[0].toLowerCase() : item.toLowerCase();
            // Filter out the user's email
            return itemEmail !== userEmailLower;
          });
      }
      return [];
    };

    const attendeesList = extractAttendees(event.attendees, userEmail);
    
    // Try to extract job titles from briefing_source
    let attendeeJobTitles = {};
    if (event.briefing_source && event.briefing_source.companies) {
      Object.values(event.briefing_source.companies).forEach(companyData => {
        if (companyData.attendees && Array.isArray(companyData.attendees)) {
          companyData.attendees.forEach(attendee => {
            if (attendee.name && attendee.job_title) {
              attendeeJobTitles[attendee.name] = attendee.job_title;
            }
          });
        }
      });
    }
    
    const attendees = attendeesList.map(name => {
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const jobTitle = attendeeJobTitles[name] || null;
      return { name, initials, jobTitle };
    });
    
    // Extract company from briefing_source
    let company = 'Unknown';
    let icpAnalysis = null;
    let criteriaBreakdown = [];
    let positiveSignals = [];
    let concerns = [];
    
    // Standard ICP criteria that should all be checked
    const allStandardCriteria = ['Size', 'Region', 'Budget', 'Industry', 'Growth'];
    const foundCriteriaLabels = new Set();
    
    if (event.briefing_source && event.briefing_source.companies) {
      const companies = Object.keys(event.briefing_source.companies);
      if (companies.length > 0) {
        company = companies[0];
        const companyData = event.briefing_source.companies[company];
        icpAnalysis = companyData?.icp_analysis;
        
        // Extract criteria breakdown from ICP analysis
        if (icpAnalysis) {
          // Extract criteria from match/mismatch data
          const criteriaData = icpAnalysis.criteria_breakdown || {};
          
          allStandardCriteria.forEach(label => {
            const key = label.toLowerCase();
            if (criteriaData[key] !== undefined) {
              foundCriteriaLabels.add(label);
              criteriaBreakdown.push({
                label,
                value: criteriaData[key].value || criteriaData[key] || '',
                matches: criteriaData[key].matches !== false, // Default to true if not specified
              });
            }
          });
          
          // Extract positive signals from ICP fit reasons
          if (icpAnalysis.icp_fit_reasons && Array.isArray(icpAnalysis.icp_fit_reasons)) {
            icpAnalysis.icp_fit_reasons.forEach(reason => {
              if (typeof reason === 'string' && reason.trim()) {
                positiveSignals.push(reason);
              }
            });
          }
          
          // Extract concerns from non-ICP reasons - these should always be shown
          if (icpAnalysis.icp_non_fit_reasons && Array.isArray(icpAnalysis.icp_non_fit_reasons)) {
            icpAnalysis.icp_non_fit_reasons.forEach(reason => {
              if (typeof reason === 'string' && reason.trim()) {
                concerns.push(reason);
              }
            });
          }
          
          // Also parse criteria from reasons if not in criteria_breakdown
          const allReasonsForCriteria = [...(icpAnalysis.icp_fit_reasons || []), ...(icpAnalysis.icp_non_fit_reasons || [])];
          const criteriaPatterns = [
            { pattern: /(?:Size|Company size|Employee count|Employees?):\s*(.+?)(?:$|,|;|\.)/i, label: 'Size' },
            { pattern: /(?:Region|Location):\s*(.+?)(?:$|,|;|\.)/i, label: 'Region' },
            { pattern: /(?:Budget|Budget authority):\s*(.+?)(?:$|,|;|\.)/i, label: 'Budget' },
            { pattern: /(?:Industry|Sector):\s*(.+?)(?:$|,|;|\.)/i, label: 'Industry' },
            { pattern: /(?:Growth|Growth stage|Stage):\s*(.+?)(?:$|,|;|\.)/i, label: 'Growth' },
          ];
          
          // Also try to extract number from "Employee count 414" format (no colon)
          const employeeCountMatch = /employee\s+count\s+(\d+)/i;
          
          allReasonsForCriteria.forEach(reason => {
            if (typeof reason === 'string') {
              // First try standard patterns with colons
              criteriaPatterns.forEach(({ pattern, label }) => {
                const match = reason.match(pattern);
                if (match) {
                  foundCriteriaLabels.add(label);
                  // Check if this criterion already exists
                  const existingIndex = criteriaBreakdown.findIndex(c => c.label === label);
                  // Determine if it matches: if the reason is in fit_reasons, it matches; if in non_fit_reasons, it doesn't
                  const isMatch = (icpAnalysis.icp_fit_reasons || []).includes(reason);
                  
                  if (existingIndex === -1) {
                    // Add new criterion
                    criteriaBreakdown.push({
                      label,
                      value: match[1].trim(),
                      matches: isMatch,
                    });
                  } else {
                    // Update existing criterion - prioritize non-match (if we find it in non-fit reasons, it doesn't match)
                    if (!isMatch) {
                      criteriaBreakdown[existingIndex].matches = false;
                    }
                    // Update value if needed
                    criteriaBreakdown[existingIndex].value = match[1].trim();
                  }
                }
              });
              
              // Special handling for "Employee count 414" format (no colon)
              const employeeCountMatchResult = reason.match(/employee\s+count\s+(\d+)/i);
              if (employeeCountMatchResult) {
                foundCriteriaLabels.add('Size');
                const existingIndex = criteriaBreakdown.findIndex(c => c.label === 'Size');
                const isMatch = (icpAnalysis.icp_fit_reasons || []).includes(reason);
                if (existingIndex === -1) {
                  criteriaBreakdown.push({
                    label: 'Size',
                    value: employeeCountMatchResult[1],
                    matches: isMatch,
                  });
                } else {
                  if (!isMatch) {
                    criteriaBreakdown[existingIndex].matches = false;
                  }
                  criteriaBreakdown[existingIndex].value = employeeCountMatchResult[1];
                }
              }
            }
          });
          
          // Add missing criteria as non-matching (show what's missing)
          allStandardCriteria.forEach(label => {
            if (!foundCriteriaLabels.has(label)) {
              // This criterion wasn't found in any reason, so it's missing/doesn't match
              criteriaBreakdown.push({
                label,
                value: 'Not specified',
                matches: false,
              });
            }
          });
        }
      }
    }
    
    // If no criteria breakdown from ICP analysis, try to parse from reasons
    if (criteriaBreakdown.length === 0 && (icpReasons.length > 0 || nonIcpReasons.length > 0)) {
      const allReasons = [...icpReasons, ...nonIcpReasons];
      const criteriaPatterns = [
        { pattern: /(?:Size|Company size|Employees?):\s*(.+?)(?:$|,|;|\.)/i, label: 'Size' },
        { pattern: /(?:Region|Location):\s*(.+?)(?:$|,|;|\.)/i, label: 'Region' },
        { pattern: /(?:Budget|Budget authority):\s*(.+?)(?:$|,|;|\.)/i, label: 'Budget' },
        { pattern: /(?:Industry|Sector):\s*(.+?)(?:$|,|;|\.)/i, label: 'Industry' },
        { pattern: /(?:Growth|Growth stage|Stage):\s*(.+?)(?:$|,|;|\.)/i, label: 'Growth' },
      ];
      
      // Also handle "Employee count 414" format (no colon)
      const employeeCountMatch = /employee\s+count\s+(\d+)/i;
      
      const foundCriteria = new Map();
      allReasons.forEach(reason => {
        if (typeof reason === 'string') {
          // Try standard patterns with colons
          criteriaPatterns.forEach(({ pattern, label }) => {
            const match = reason.match(pattern);
            if (match) {
              // Check if this reason is in the ICP fit reasons (matches) or non-fit (doesn't match)
              const isMatch = icpReasons.includes(reason);
              
              if (!foundCriteria.has(label)) {
                // Add new criterion
                foundCriteria.set(label, {
                  label,
                  value: match[1].trim(),
                  matches: isMatch,
                });
              } else {
                // Update existing criterion - if we find it in non-fit reasons, mark as non-match
                if (!isMatch) {
                  foundCriteria.set(label, {
                    ...foundCriteria.get(label),
                    matches: false,
                  });
                }
                // Always update value
                foundCriteria.set(label, {
                  ...foundCriteria.get(label),
                  value: match[1].trim(),
                });
              }
            }
          });
          
          // Special handling for "Employee count 414" format (no colon)
          const employeeCountMatchResult = reason.match(/employee\s+count\s+(\d+)/i);
          if (employeeCountMatchResult) {
            const isMatch = icpReasons.includes(reason);
            if (!foundCriteria.has('Size')) {
              foundCriteria.set('Size', {
                label: 'Size',
                value: employeeCountMatchResult[1],
                matches: isMatch,
              });
            } else {
              if (!isMatch) {
                foundCriteria.set('Size', {
                  ...foundCriteria.get('Size'),
                  matches: false,
                });
              }
              foundCriteria.set('Size', {
                ...foundCriteria.get('Size'),
                value: employeeCountMatchResult[1],
              });
            }
          }
        }
      });
      
      criteriaBreakdown = Array.from(foundCriteria.values());
      
      // Add missing criteria as non-matching (show what's missing)
      allStandardCriteria.forEach(label => {
        if (!foundCriteria.has(label)) {
          // This criterion wasn't found in any reason, so it's missing/doesn't match
          criteriaBreakdown.push({
            label,
            value: 'Not specified',
            matches: false,
          });
        }
      });
    }
    
    // Generate concerns from missing/non-matching criteria
    // Exclude Region, Budget, Industry, and Growth when they are "Not specified"
    // Also exclude Size-based concerns entirely (these are already covered in the summary)
    const criteriaToExcludeWhenNotSpecified = ['Region', 'Budget', 'Industry', 'Growth'];
    const missingCriteria = criteriaBreakdown.filter(c => c.matches === false);
    const generatedConcerns = [];
    missingCriteria.forEach(criterion => {
      // Completely skip Size criteria in the detailed reasons
      if (criterion.label === 'Size') {
        return;
      }
      
      // Skip criteria that are not specified and in the exclusion list
      if (criterion.value === 'Not specified' && criteriaToExcludeWhenNotSpecified.includes(criterion.label)) {
        return; // Skip this criterion
      }
      
      if (criterion.value !== 'Not specified' && criterion.value !== '') {
        generatedConcerns.push(`${criterion.label}: ${criterion.value} does not match ICP criteria`);
      } else {
        generatedConcerns.push(`${criterion.label} not specified - missing from ICP criteria`);
      }
    });
    
    // Merge generated concerns with existing concerns, avoiding duplicates
    const existingConcernsText = concerns.map(c => String(c));
    generatedConcerns.forEach(concern => {
      if (!existingConcernsText.includes(concern)) {
        concerns.push(concern);
      }
    });
    
    // ALWAYS extract concerns from non-ICP reasons - these should always be shown
    // This is critical - concerns must be extracted from nonIcpReasons
    if (nonIcpReasons.length > 0) {
      const nonIcpReasonsList = nonIcpReasons.filter(r => typeof r === 'string' && r.trim());
      // Merge with existing concerns, avoiding duplicates
      const existingConcernsText2 = concerns.map(c => String(c));
      nonIcpReasonsList.forEach(reason => {
        if (!existingConcernsText2.includes(reason)) {
          concerns.push(reason);
        }
      });
    }
    
    // Extract positive signals from ICP reasons
    if (icpReasons.length > 0) {
      const icpReasonsList = icpReasons.filter(r => typeof r === 'string' && r.trim());
      const existingSignals = positiveSignals.map(s => String(s));
      icpReasonsList.forEach(reason => {
        if (!existingSignals.includes(reason)) {
          positiveSignals.push(reason);
        }
      });
    }
    
    // Use location as platform (will display Google Meet URL if it exists)
    const platform = event.location && typeof event.location === 'string' && event.location.trim() && event.location !== 'No Location'
      ? event.location 
      : 'Meeting';
    
    // Calculate ICP score from reasons (12+ = high fit, 7-11 = medium fit, <7 = low fit)
    // Score is based on: base 12 points for fitting, +1 per matching criteria (max 3 bonus = 15 total)
    // Or penalized based on non-matching criteria
    let icpScore = 0;
    const matchingCriteriaCount = criteriaBreakdown.filter(c => c.matches === true).length;
    const nonMatchingCriteriaCount = criteriaBreakdown.filter(c => c.matches === false).length;
    
    if (fitsIcp) {
      // High fit - base score 12, +1 per matching criteria (up to 3 bonus points = max 15)
      // Each of 5 criteria can contribute: Size, Region, Budget, Industry, Growth
      // Score = 12 (base) + matchingCriteriaCount (max 3 bonus points) = 12-15 range
      icpScore = 12 + Math.min(matchingCriteriaCount, 3);
    } else {
      // Calculate score based on non-ICP reasons and non-matching criteria
      // Base score 7, minus points for each non-matching criterion
      const maxReasons = 8;
      icpScore = Math.max(0, Math.floor(7 - (nonIcpReasons.length / maxReasons * 7) - (nonMatchingCriteriaCount * 0.5)));
    }

    // Debug logging
    console.log('transformEventToICPMeeting - criteriaBreakdown:', criteriaBreakdown);
    console.log('transformEventToICPMeeting - concerns:', concerns);
    console.log('transformEventToICPMeeting - positiveSignals:', positiveSignals);
    console.log('transformEventToICPMeeting - icpReasons:', icpReasons);
    console.log('transformEventToICPMeeting - nonIcpReasons:', nonIcpReasons);
    
    return {
      id: event.event_id,
      title: event.event || event.summary || 'Untitled Meeting',
      date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      duration: `${duration} min`,
      company,
      platform,
      attendees,
      icpScore: {
        score: icpScore,
        maxScore: 15,
      },
      reasons: fitsIcp ? icpReasons : nonIcpReasons,
      readyToSend: event.enriched_ready_to_send || false,
      fitsIcp,
      icpReasons,
      nonIcpReasons,
      criteriaBreakdown,
      positiveSignals: positiveSignals.length > 0 ? positiveSignals : (fitsIcp ? icpReasons : []),
      // ALWAYS include concerns if nonIcpReasons exist - even if concerns array is empty
      concerns: concerns.length > 0 ? concerns : (nonIcpReasons.length > 0 ? nonIcpReasons.filter(r => typeof r === 'string' && r.trim()) : []),
    };
  };

  // Categorize meetings by ICP score
  const categorizeMeetings = () => {
    const allMeetings = [...icpFitMeetings, ...nonIcpMeetings];
    return {
      highFit: allMeetings.filter(m => m.icpScore?.score >= 12),
      mediumFit: allMeetings.filter(m => m.icpScore?.score >= 7 && m.icpScore?.score < 12),
      lowFit: allMeetings.filter(m => m.icpScore?.score < 7),
      all: allMeetings,
    };
  };

  const categorizedMeetings = categorizeMeetings();
  
  // Only show low ICP meetings
  const getFilteredMeetings = () => {
    return categorizedMeetings.lowFit;
  };

  const filteredMeetings = getFilteredMeetings();

  // Calculate average ICP score
  const calculateAvgIcpScore = () => {
    // Use stored average if available, otherwise calculate from current meetings
    if (avgIcpScoreData.current !== null) {
      return avgIcpScoreData.current.toFixed(1);
    }
    const all = categorizedMeetings.all;
    if (all.length === 0) return 0;
    const sum = all.reduce((acc, m) => acc + (m.icpScore?.score || 0), 0);
    return (sum / all.length).toFixed(1);
  };

  const formatPercentageChange = () => {
    if (avgIcpScoreData.change === null || avgIcpScoreData.change === undefined) {
      return null;
    }
    const sign = avgIcpScoreData.change >= 0 ? '+' : '';
    return `${sign}${avgIcpScoreData.change.toFixed(0)}%`;
  };

  // Fetch ICP criteria and load into state
  const fetchICPCriteria = async () => {
    setIsLoadingCriteria(true);
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

      const response = await fetch(`${apiUrl}/icp/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.icp_criteria) {
        const criteria = result.icp_criteria;
        setIcpCriteria(criteria);
        
        // Set ICP Focus toggle state
        if (typeof criteria.enabled !== 'undefined') {
          setIcpAnalysisEnabled(criteria.enabled);
          setIcpCriteriaExpanded(criteria.enabled);
        }
        
        // Map backend values to frontend format for employee ranges
        const backendToFrontendEmployees = {
          '1-10': '1-10',
          '11-50': '11-50',
          '51-100': '51-200',
          '101-500': '201-500',
          '500+': '501-1000',
        };
        
        // Map backend values to frontend format for years
        const backendToFrontendYears = {
          'Last 12 months': '0-2',
          '1-3 years': '3-5',
          'More than 3 years': '6-10', // This maps to 6-10, but could also be 11-20 or 20+ depending on actual company age
        };
        
        if (criteria.employee_sizes && Array.isArray(criteria.employee_sizes)) {
          // Remove duplicates and map backend format to frontend format
          const mappedSizes = Array.from(new Set(criteria.employee_sizes))
            .map(size => backendToFrontendEmployees[size] || size)
            .filter(size => size); // Remove any undefined/null values
          setEmployeeRanges(mappedSizes);
        }
        
        if (criteria.founded_years && Array.isArray(criteria.founded_years)) {
          // Remove duplicates and map backend format to frontend format
          const mappedYears = Array.from(new Set(criteria.founded_years))
            .map(year => backendToFrontendYears[year] || year)
            .filter(year => year); // Remove any undefined/null values
          setYearsFounded(mappedYears);
        }

        // Load any saved \"other\" criteria
        if (typeof criteria.other_criteria === 'string') {
          setOtherCriteria(criteria.other_criteria);
        } else {
          setOtherCriteria('');
        }
      }
    } catch (error) {
      console.error('Error fetching ICP criteria:', error);
    } finally {
      setIsLoadingCriteria(false);
    }
  };
  
  // Save ICP settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');

      // Map frontend values to backend format
      const employeeSizesMap = {
        '1-10': '1-10',
        '11-50': '11-50',
        '51-200': '51-100',
        '201-500': '101-500',
        '501-1000': '500+',
        '1001-5000': '500+',
        '5001+': '500+',
      };

      const yearsFoundedMap = {
        '0-2': 'Last 12 months',
        '3-5': '1-3 years',
        '6-10': 'More than 3 years',
        '11-20': 'More than 3 years',
        '20+': 'More than 3 years',
      };

      const requestBody = {
        enabled: icpAnalysisEnabled,
        employee_sizes: employeeRanges.map(range => employeeSizesMap[range] || range),
        founded_years: yearsFounded.map(year => yearsFoundedMap[year] || year),
        other_criteria: otherCriteria && otherCriteria.trim() ? otherCriteria.trim() : null,
      };

      console.log('Saving ICP criteria:', requestBody);

      const response = await fetch(`${apiUrl}/icp/criteria`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (result.success) {
        setSaveMessage('✅ Settings saved successfully!');
        // Reload criteria to reflect changes
        await fetchICPCriteria();
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveMessage(`❌ ${result.message || 'Failed to save settings'}`);
      }
      
    } catch (error) {
      console.error('Error saving ICP settings:', error);
      setSaveMessage('❌ Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchMeetingsWithICP();
    fetchNonIcpCount();
    fetchICPCriteria();
    fetchAverageIcpScore();
  }, []);

  // Refetch average score when meetings change (for fallback calculation)
  useEffect(() => {
    if (!isLoadingMeetings && (icpFitMeetings.length > 0 || nonIcpMeetings.length > 0)) {
      // Only refetch if we don't have data yet (fallback case)
      if (avgIcpScoreData.current === null) {
        fetchAverageIcpScore();
      }
    }
  }, [icpFitMeetings, nonIcpMeetings, isLoadingMeetings]);

  // eslint-disable-next-line no-unused-vars
  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    
    try {
      const token = await getAuthToken();
      const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://merlin-heart-1.onrender.com' : 'http://localhost:8000');
      
      const response = await fetch(`${apiUrl}/icp/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysisResults(result);
        setHasEnrichedMeetings(true);
        // Reload meetings to get updated ICP analysis
        await fetchMeetingsWithICP();
        await fetchNonIcpCount();
      } else {
        if (!result.has_enriched_meetings) {
          setHasEnrichedMeetings(false);
        } else {
          setErrorMessage(result.message || 'Analysis failed');
        }
      }
    } catch (error) {
      console.error('Error generating ICP analysis:', error);
      setErrorMessage('Failed to generate ICP analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGoToMeetings = () => {
    navigate('/meetings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f1e8] via-[#f8f6f1] to-[#faf9f5]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Your Weekly ICP Report</h1>
          </div>
          <p className="text-center text-gray-600 max-w-3xl mx-auto mb-6">
            Our Weekly ICP Report flags meetings that fall outside your ideal customer profile, so you can skip low-value calls and focus on what matters. Reports are delivered every Monday and Wednesday morning, keeping you on top of your pipeline without extra effort.
          </p>
        </div>

        {/* Summary Section - Light Blue */}
        {!isLoadingMeetings && nonIcpMeetings.length > 0 && (
          <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: '#DBEAFE', border: '1px solid #93C5FD' }}>
            <p className="text-lg italic mb-4" style={{ color: '#1E40AF' }}>
              We found <span className="font-bold">{nonIcpMeetings.length}</span> meetings in the upcoming week that <span className="font-bold">do not</span> match your ICP.
            </p>
            <div className="mt-4">
              <p className="text-sm font-bold mb-2" style={{ color: '#1E40AF' }}>Your specific criteria:</p>
              <div className="space-y-1 text-sm" style={{ color: '#1E40AF' }}>
                {employeeRanges && employeeRanges.length > 0 && (
                  <p>
                    <span className="font-medium">Employee size:</span>{' '}
                    {Array.from(new Set(employeeRanges)) // Remove duplicates
                      .map(range => {
                        // Map frontend format to display format
                        const displayMap = {
                          '1-10': '1-10',
                          '11-50': '11-50',
                          '51-200': '51-200',
                          '201-500': '201-500',
                          '501-1000': '501-1000',
                          '1001-5000': '1001-5000',
                          '5001+': '5001+',
                        };
                        return displayMap[range] || range;
                      })
                      .join(', ')}
                  </p>
                )}
                {yearsFounded && yearsFounded.length > 0 && (
                  <p>
                    <span className="font-medium">Founded years:</span>{' '}
                    {Array.from(new Set(yearsFounded)) // Remove duplicates
                      .map(year => {
                        // Map frontend format to display format
                        const displayMap = {
                          '0-2': 'Founded 0-2 years ago',
                          '3-5': 'Founded 3-5 years ago',
                          '6-10': 'Founded 6-10 years ago',
                          '11-20': 'Founded 11-20 years ago',
                          '20+': 'Founded 20+ years ago',
                        };
                        return displayMap[year] || year;
                      })
                      .join(', ')}
                  </p>
                )}
                {otherCriteria && otherCriteria.trim() && (
                  <p>
                    <span className="font-medium">Other:</span>{' '}
                    {otherCriteria.trim()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Smart Recommendations Section - Only show Low Fit */}
        {/* COMMENTED OUT - Only showing low ICP meetings
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Recommendations</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiTarget className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{categorizedMeetings.highFit.length}</div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Focus Here</h4>
              <p className="text-sm text-gray-600">High-fit meetings deserve your best prep</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{categorizedMeetings.mediumFit.length}</div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Consider</h4>
              <p className="text-sm text-gray-600">Medium-fit might need more qualification</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{categorizedMeetings.lowFit.length}</div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Delegate</h4>
              <p className="text-sm text-gray-600">Low-fit may not be worth your time</p>
            </div>
          </div>
        </div>
        */}


        {/* No Enriched Meetings Message */}
        {!hasEnrichedMeetings && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiCalendar className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  No Enriched Meetings Found
                </h2>
                <p className="text-gray-700 mb-3">
                  You need to sync your calendar and wait for enrichment to complete before running ICP analysis.
                </p>
                <button
                  onClick={handleGoToMeetings}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Go to Your Meetings
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Success Message */}
        {analysisResults && analysisResults.success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
            <p className="text-green-800 font-medium">{analysisResults.message}</p>
            <p className="text-green-700 text-sm mt-1">
              Total meetings analyzed: {analysisResults.total_meetings} | 
              ICP Fit: {analysisResults.icp_fit_count} | 
              Non-ICP: {analysisResults.non_icp_count}
            </p>
          </div>
        )}


        {/* Loading State */}
        {isLoadingMeetings && (
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FiRefreshCw className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Loading meetings...
            </h3>
          </div>
        )}


        {/* Meeting Cards - Filtered */}
        {!isLoadingMeetings && filteredMeetings.length > 0 && (
          <div className="space-y-4 mb-8">
            {filteredMeetings.map((meeting) => (
              <ICPMeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}

        {/* No low ICP meetings */}
        {!isLoadingMeetings && filteredMeetings.length === 0 && categorizedMeetings.all.length > 0 && (
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-12 text-center">
            <p className="text-gray-600">No low ICP meetings to cancel. All your meetings are high or medium fit.</p>
        </div>
        )}

        {/* Empty State (shown when no meetings with ICP analysis) */}
        {!isLoadingMeetings && nonIcpMeetings.length === 0 && icpFitMeetings.length === 0 && hasEnrichedMeetings && (
          <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Low ICP Meetings
            </h3>
            <p className="text-gray-600 mb-4">
              No low ICP meetings found. All your meetings are high or medium fit.
            </p>
          </div>
        )}

        {/* ICP Focus Section */}
        <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mt-8">
          {/* ICP Focus Toggle */}
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <FiTarget className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900">ICP Focus</h3>
                <p className="text-sm text-gray-600">Include Ideal Customer Profile analysis in reports</p>
              </div>
            </div>
            <button
              onClick={() => {
                const newState = !icpAnalysisEnabled;
                setIcpAnalysisEnabled(newState);
                setIcpCriteriaExpanded(newState);
              }}
              className={`relative w-12 h-6 rounded-full transition ${
                icpAnalysisEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  icpAnalysisEnabled ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Collapsible ICP Criteria Section */}
          {icpAnalysisEnabled && (
            <div className="mt-4">
              <button
                onClick={() => setIcpCriteriaExpanded(!icpCriteriaExpanded)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <FiTarget className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Define Your Ideal Customer Profile</span>
                </div>
                {icpCriteriaExpanded ? (
                  <FiChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <FiChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {icpCriteriaExpanded && (
                <div className="mt-4 space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-4">Set criteria to identify which meetings align with your target customer profile</p>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiBriefcase className="w-4 h-4" />
                        Number of Employees (select all that apply)
                      </label>
                      <div className="space-y-2">
                        {['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+'].map(range => {
                          const isChecked = employeeRanges.includes(range);
                          return (
                            <label key={range} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEmployeeRanges([...employeeRanges, range]);
                                  } else {
                                    setEmployeeRanges(employeeRanges.filter(r => r !== range));
                                  }
                                }}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <span className="text-sm text-gray-700">{range} employees</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiTarget className="w-4 h-4" />
                        Year Founded (select all that apply)
                      </label>
                      <div className="space-y-2">
                        {['0-2', '3-5', '6-10', '11-20', '20+'].map(years => (
                          <label key={years} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={yearsFounded.includes(years)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setYearsFounded([...yearsFounded, years]);
                                } else {
                                  setYearsFounded(yearsFounded.filter(y => y !== years));
                                }
                              }}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Founded {years} years ago</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiZap className="w-4 h-4" />
                        Other (Optional)
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">Beta</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Additional criteria..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        value={otherCriteria}
                        onChange={(e) => setOtherCriteria(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-lg ${saveMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {saveMessage}
            </div>
          )}

          {/* Save Changes Button */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ICPAnalysis;
