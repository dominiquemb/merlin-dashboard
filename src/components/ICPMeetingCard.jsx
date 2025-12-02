import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCheckCircle, FiX, FiVideo } from 'react-icons/fi';

const ICPMeetingCard = ({ meeting }) => {
  const navigate = useNavigate();
  // Determine if this is an ICP fit or non-fit based on score
  const isIcpFit = meeting.icpScore && meeting.icpScore.score >= 12;
  const isMediumFit = meeting.icpScore && meeting.icpScore.score >= 7 && meeting.icpScore.score < 12;
  const icpScore = meeting.icpScore?.score || 0;

  // Format date for display - "24 September @ 8:30 AM GMT"
  const formatDate = (dateStr, timeStr) => {
    if (!dateStr) return '';
    try {
      let date;
      if (typeof dateStr === 'string') {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return dateStr;
        }
      } else {
        date = dateStr;
      }
      
      const day = date.getDate();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[date.getMonth()];
      
      // Format time if provided
      let timeDisplay = '';
      if (timeStr) {
        timeDisplay = ` @ ${timeStr} GMT`;
      } else if (date.getHours() !== undefined) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        timeDisplay = ` @ ${displayHours}:${displayMinutes} ${ampm} GMT`;
      }
      
      return `${day} ${month}${timeDisplay}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Format attendees list - same approach as Meetings page
  const formatAttendees = () => {
    if (!meeting.attendees || meeting.attendees.length === 0) {
      return '';
    }
    
    // If attendees is an array of objects with name property
    if (meeting.attendees[0] && typeof meeting.attendees[0] === 'object' && meeting.attendees[0].name) {
      return meeting.attendees.map(a => a.name).filter(Boolean).join(', ');
    }
    
    // If attendees is an array of strings
    if (typeof meeting.attendees[0] === 'string') {
      return meeting.attendees.join(', ');
    }
    
    // Fallback: try to extract names from objects
    const names = meeting.attendees.map(a => {
      if (typeof a === 'string') return a;
      if (a && typeof a === 'object') return a.name || a.email || '';
      return '';
    }).filter(Boolean);
    
    return names.length > 0 ? names.join(', ') : '';
  };

  // Use criteria breakdown, positive signals, and concerns from meeting data
  const criteriaBreakdown = meeting.criteriaBreakdown || meeting.criteria_breakdown || [];
  let positiveSignals = meeting.positiveSignals || meeting.positive_signals || [];
  let concerns = meeting.concerns || meeting.concerns_list || [];
  
  // Debug logging
  console.log('ICPMeetingCard - meeting:', meeting);
  console.log('ICPMeetingCard - criteriaBreakdown:', criteriaBreakdown);
  console.log('ICPMeetingCard - concerns:', concerns);
  console.log('ICPMeetingCard - positiveSignals:', positiveSignals);
  console.log('ICPMeetingCard - isIcpFit:', isIcpFit);
  console.log('ICPMeetingCard - meeting.reasons:', meeting.reasons);
  console.log('ICPMeetingCard - meeting.nonIcpReasons:', meeting.nonIcpReasons);
  
  // Fallback: extract concerns from non-ICP reasons if not already set
  if (concerns.length === 0) {
    if (meeting.nonIcpReasons && meeting.nonIcpReasons.length > 0) {
      concerns = meeting.nonIcpReasons.filter(r => typeof r === 'string' && r.trim());
    } else if (!isIcpFit && meeting.reasons && meeting.reasons.length > 0) {
      concerns = meeting.reasons.filter(r => typeof r === 'string' && r.trim());
    }
  }
  
  // Fallback: extract positive signals from ICP reasons if not already set
  if (positiveSignals.length === 0 && isIcpFit) {
    if (meeting.icpReasons && meeting.icpReasons.length > 0) {
      positiveSignals = meeting.icpReasons.filter(r => typeof r === 'string' && r.trim());
    } else if (meeting.reasons && meeting.reasons.length > 0) {
      positiveSignals = meeting.reasons.filter(r => typeof r === 'string' && r.trim());
    }
  }
  
  console.log('ICPMeetingCard - Final concerns:', concerns);
  console.log('ICPMeetingCard - Final criteriaBreakdown:', criteriaBreakdown);

  // Get contact person from attendees
  const getContactPerson = () => {
    if (!meeting.attendees || meeting.attendees.length === 0) {
      return null;
    }
    const firstAttendee = meeting.attendees[0];
    if (typeof firstAttendee === 'object' && firstAttendee.name) {
      // Try to get job title from meeting data if available
      const jobTitle = firstAttendee.jobTitle || firstAttendee.job_title || firstAttendee.title || '';
      return {
        name: firstAttendee.name,
        jobTitle: jobTitle
      };
    }
    if (typeof firstAttendee === 'string') {
      return {
        name: firstAttendee,
        jobTitle: ''
      };
    }
    return null;
  };

  const contactPerson = getContactPerson();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      {/* Date, Meeting Name, and Attendee on same line */}
      <div className="text-sm text-gray-900 mb-3 flex items-center flex-wrap">
        <span>{formatDate(meeting.date, meeting.time)}</span>
        <span className="ml-2">•</span>
        <span className="ml-2">{meeting.title || meeting.platform || 'Meeting'}</span>
        {formatAttendees() && (
          <>
            <span className="ml-2">-</span>
            <span className="ml-2 text-gray-800 font-medium">{formatAttendees().toLowerCase()}</span>
          </>
        )}
        {meeting.company && (
          <>
            <span className="ml-2">({meeting.company.toLowerCase()})</span>
          </>
        )}
      </div>

      {/* Company Name */}
      <div className="text-lg font-semibold text-gray-900 mb-2 uppercase">
        {meeting.company || 'Unknown Company'}
      </div>

      {/* Contact Person */}
      {contactPerson && (
        <div className="text-sm text-gray-700 mb-4">
          {contactPerson.name}
          {contactPerson.jobTitle && (
            <span>, <span className="italic font-normal">{contactPerson.jobTitle}</span></span>
          )}
        </div>
      )}

      {/* Why it's not relevant - Yellow Box */}
      {concerns.length > 0 && (
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#FEF3C7' }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#92400E' }}>Why it's not relevant:</p>
          <ul className="space-y-1">
            {concerns.map((concern, idx) => {
              // Format concern text to match screenshot format
              let formattedConcern = concern;
              
              // Handle "Employee count 1" format - capitalize properly
              if (concern.match(/employee\s+count\s+\d+/i)) {
                formattedConcern = concern.replace(/employee\s+count/i, 'Employee count');
              }
              // Handle "Founded in 2025" format - ensure proper capitalization
              if (concern.match(/founded\s+in/i)) {
                formattedConcern = concern.replace(/founded\s+in/i, 'Founded in');
              }
              
              return (
                <li key={idx} className="text-sm flex items-start" style={{ color: '#92400E' }}>
                  <span className="mr-2">•</span>
                  <span>{formattedConcern}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

    </div>
  );
};

export default ICPMeetingCard;
