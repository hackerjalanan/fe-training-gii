import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, Calendar, Building2, Mail, Clock, Award, MapPin, User } from 'lucide-react';

const ModernParticipantDetail = ({ participant, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const scrollRef = useRef(null);

  const formatDate = useMemo(() => (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Handle scroll event to sync tab indicator
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const scrollLeft = scrollRef.current.scrollLeft;
        const width = scrollRef.current.offsetWidth;
        const currentTab = scrollLeft < width / 2 ? 'overview' : 'training';
        
        if (currentTab !== activeTab) {
          setActiveTab(currentTab);
        }
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [activeTab]);

  if (!participant) return null;

  const scrollToTab = (index) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth',
      });
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    scrollToTab(tab === 'overview' ? 0 : 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] relative animate-in fade-in duration-300">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{participant.name || 'Participant Details'}</h2>
            <button
              className="rounded-full bg-white bg-opacity-20 p-2 hover:bg-opacity-30 transition-all"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          <p className="mt-1 text-blue-100">{participant.agency || 'No Agency'}</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'training', label: 'Training Programs' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`relative py-4 px-4 font-medium text-sm transition-all
                  ${activeTab === tab.key
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                {tab.label}
                <span
                  className={`absolute left-0 bottom-0 h-0.5 w-full transition-all duration-300 ease-in-out
                    ${activeTab === tab.key ? 'bg-blue-600' : 'bg-transparent'}
                  `}
                />
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content Swipeable */}
        <div ref={scrollRef} className="w-full h-[60vh] overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory">
          <div className="flex flex-nowrap h-full">
            {/* Overview Tab */}
            <div className="w-full min-w-full p-6 overflow-y-auto snap-start">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoCard
                    icon={<User className="text-blue-500" />}
                    label="Full Name"
                    value={participant.name || 'N/A'}
                  />
                  <InfoCard
                    icon={<Building2 className="text-indigo-500" />}
                    label="Agency"
                    value={participant.agency || 'N/A'}
                  />
                  <InfoCard
                    icon={<Mail className="text-indigo-500" />}
                    label="Email"
                    value={participant.email || 'N/A'}
                  />
                  <InfoCard
                    icon={<MapPin  className="text-indigo-500" />}
                    label="Domicile"
                    value={participant.domicile || 'N/A'}
                  />
                  <InfoCard
                    icon={<Calendar className="text-green-500" />}
                    label="Created At"
                    value={formatDate(participant.created_at)}
                  />
                  <InfoCard
                    icon={<Clock className="text-amber-500" />}
                    label="Updated At"
                    value={formatDate(participant.updated_at)}
                  />
                </div>
              </div>
            </div>

            {/* Training Tab */}
            <div className="w-full min-w-full p-6 overflow-y-auto snap-start">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                <Award className="mr-2 text-blue-600" /> Training Programs
              </h3>

              {Array.isArray(participant.participant_training) && participant.participant_training.length > 0 ? (
                <div className="space-y-4">
                  {participant.participant_training.map((training) => {
                    const sesi = training.training_sesi || {};
                    const program = sesi.program_training || {};

                    return (
                      <div
                        key={training.participant_training_id}
                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-all hover:shadow-md bg-white"
                      >
                        <div className="flex items-start">
                          <div className="bg-blue-100 rounded-lg p-3 mr-4">
                            <Award className="text-blue-600" size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">
                              {program.name || 'N/A'}
                              {program.alias && (
                                <span className="text-blue-600 ml-2">({program.alias})</span>
                              )}
                            </p>

                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar size={16} className="mr-1 text-gray-400" />
                                <span>{formatDate(sesi.start_date)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin size={16} className="mr-1 text-gray-400" />
                                <span>{sesi.location || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="mt-2 flex justify-between items-center">
                              <div className="text-sm">{sesi.name || 'No session name'}</div>
                              <StatusBadge status={sesi.status_active} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Award className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No training programs enrolled</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper components
const InfoCard = ({ icon, label, value }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-all hover:shadow-sm">
    <div className="flex items-center mb-2">
      {icon}
      <p className="text-sm text-gray-500 ml-2">{label}</p>
    </div>
    <p className="font-medium text-gray-800">{value}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  if (!status) return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">N/A</span>;

  let colorClass = 'bg-gray-100 text-gray-600';

  if (status.toLowerCase() === 'active') {
    colorClass = 'bg-green-100 text-green-700';
  } else if (status.toLowerCase() === 'completed') {
    colorClass = 'bg-blue-100 text-blue-700';
  } else if (status.toLowerCase() === 'pending') {
    colorClass = 'bg-yellow-100 text-yellow-700';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};

export default ModernParticipantDetail;