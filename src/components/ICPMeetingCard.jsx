import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiUsers, FiCheckCircle, FiX } from 'react-icons/fi';

const ICPMeetingCard = ({ meeting }) => {
  const navigate = useNavigate();
  // Determine if this is an ICP fit or non-fit based on score
  const isIcpFit = meeting.icpScore && meeting.icpScore.score >= 12;
  const isMediumFit = meeting.icpScore && meeting.icpScore.score >= 7 && meeting.icpScore.score < 12;
  const icpScore = meeting.icpScore?.score || 0;

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Handle different date formats
      let date;
      if (typeof dateStr === 'string') {
        // Try parsing as a date string
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          // If it's already formatted like "Jan 1, 2024", return as-is
          return dateStr;
        }
      } else {
        date = dateStr;
      }
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      if (date.getTime() === today.getTime()) {
        return 'Today';
      } else if (date.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      }
      return dateStr;
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

  return (
    <div className="bg-[#fafafa] border border-gray-100 rounded-2xl p-6 mb-4">
      {/* Company Name and ICP Score */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{meeting.company || meeting.title}</h3>
        {icpScore > 0 && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isIcpFit ? 'bg-green-100 text-green-700' : 
            isMediumFit ? 'bg-yellow-100 text-yellow-700' : 
            'bg-red-100 text-red-700'
          }`}>
            ICP {icpScore}/{meeting.icpScore?.maxScore || 15}
          </span>
        )}
      </div>

      {/* Meeting Details - Single Row, Evenly Spaced */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <FiClock className="w-4 h-4" />
          <span>{formatDate(meeting.date)} {meeting.time}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <FiUsers className="w-4 h-4" />
          <span>{formatAttendees()}</span>
        </div>
      </div>

      {/* Criteria Breakdown, Positive Signals, and Concerns */}
      {(criteriaBreakdown.length > 0 || positiveSignals.length > 0 || concerns.length > 0 || (meeting.reasons && meeting.reasons.length > 0) || (meeting.nonIcpReasons && meeting.nonIcpReasons.length > 0)) && (
        <div className="mb-6">
          {/* Criteria Breakdown - ALWAYS show if there are criteria or reasons */}
          {(criteriaBreakdown.length > 0 || (meeting.reasons && meeting.reasons.length > 0)) && (
            <>
              <h4 className="font-semibold text-gray-900 mb-3">Criteria Breakdown</h4>
              {criteriaBreakdown.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {criteriaBreakdown.map((criterion, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {criterion.matches !== false && criterion.matches !== undefined ? (
                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <FiX className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-gray-700">
                        {criterion.label}: {criterion.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : meeting.reasons && meeting.reasons.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {meeting.reasons.filter(r => typeof r === 'string').slice(0, 4).map((reason, idx) => {
                    // Try to parse criteria from reason text with colon: "Size: 414"
                    let criteriaMatch = reason.match(/(Size|Region|Budget|Industry|Growth):\s*(.+)/i);
                    if (criteriaMatch) {
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {isIcpFit ? (
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <FiX className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-gray-700">
                            {criteriaMatch[1]}: {criteriaMatch[2]}
                          </span>
                        </div>
                      );
                    }
                    
                    // Try to parse "Employee count 414" format (no colon)
                    const employeeCountMatch = reason.match(/employee\s+count\s+(\d+)/i);
                    if (employeeCountMatch) {
                      return (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {isIcpFit ? (
                            <FiCheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <FiX className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-gray-700">
                            Size: {employeeCountMatch[1]}
                          </span>
                        </div>
                      );
                    }
                    
                    return null;
                  }).filter(Boolean)}
                </div>
              )}
            </>
          )}

          {/* Positive Signals */}
          {positiveSignals.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-green-700 mb-2">Positive Signals:</p>
              <div className="flex flex-wrap gap-2">
                {positiveSignals.map((signal, idx) => (
                  <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Concerns - ALWAYS show if there are any */}
          {concerns.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Concerns</h4>
              <div className="flex flex-wrap gap-2">
                {concerns.map((concern, idx) => (
                  <span key={idx} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/meetings', { state: { selectedMeetingId: meeting.id } })}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition text-sm"
        >
          View Brief
        </button>
        <button 
          onClick={() => navigate('/data-enrichment')}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition text-sm"
        >
          Enrich Data
        </button>
        {!isIcpFit && (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            Consider Delegating
          </span>
        )}
      </div>
    </div>
  );
};

export default ICPMeetingCard;
