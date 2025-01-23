import React, { useState, useEffect, useRef } from 'react';

const ReportPage = () => {
  const [bibleVerse, setBibleVerse] = useState('');
  const verseRef = useRef(null);
  const scrollCount = useRef(0);

  // Define the fetchBibleVerse function
  const fetchBibleVerse = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
      setBibleVerse(data.verse);
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
    }
  };

  // Start scrolling animation for the Bible verse
  const startScrollAnimation = () => {
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      void verseRef.current.offsetHeight; // Trigger reflow
      verseRef.current.style.animation = 'scrollVerse 15s linear';
    }
  };

  // Handle the end of the scrolling animation
  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      startScrollAnimation();
    } else {
      scrollCount.current = 0;
      fetchBibleVerse(); // Fetch a new verse after two scroll cycles
    }
  };

  // Fetch the Bible verse when the component mounts
  useEffect(() => {
    fetchBibleVerse();
  }, []);

  // Start the scrolling animation when the Bible verse is updated
  useEffect(() => {
    if (bibleVerse) {
      startScrollAnimation();
    }
  }, [bibleVerse]);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen p-8">
      {/* Scrolling Bible Verse */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md mb-8">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="overflow-hidden">
              <p
                ref={verseRef}
                className="text-purple-700 italic text-sm animate-scroll"
                onAnimationEnd={handleScrollEnd}
              >
                {bibleVerse || 'Loading verse...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-800">St. Philip's Kihingo Parish 2023 Report</h1>

        {/* Church Background Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Church Background</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-gray-700 leading-relaxed">
              St. Philip's Kihingo Parish was established in the year 2000 under the guidance of Bishop Emeritus Peter Njenga. The church began with a humble congregation of 18 adults and 48 Sunday school children. Over the years, the church has grown significantly, now serving over 550 members across three services: Sunday School, English, and Kikuyu services.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              The current church building, completed in 2015 at a cost of Kshs. 15 million, stands as a testament to the dedication and faith of the congregation. The church is located in a cosmopolitan area, making it accessible to a diverse community. With four active cell groups—Gicoco, Ruthiru-ini, Kihingo, and Karunga—the church continues to foster spiritual growth and community engagement.
            </p>
          </div>
        </section>

        {/* SWOT Analysis Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">SWOT Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Strengths</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Dedicated clergy and leaders</li>
                <li>Growing population</li>
                <li>Good infrastructure</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Weaknesses</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Lack of expansion space</li>
                <li>Underutilized talents</li>
                <li>Unemployment among congregants</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Opportunities</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Metropolitan location</li>
                <li>Increasing residential units</li>
                <li>Access to utilities</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">Threats</h3>
              <ul className="list-disc list-inside text-gray-700">
                <li>Competition from charismatic churches</li>
                <li>Insecurity</li>
                <li>Drug abuse among youth</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pastoral Report Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Pastoral Report</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">Baptisms</h3>
                <p className="text-gray-700">18 (10 male, 8 female)</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">Confirmations</h3>
                <p className="text-gray-700">26 (12 male, 14 female)</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">Deaths</h3>
                <p className="text-gray-700">6 (4 male, 2 female)</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-purple-600">New Members</h3>
                <p className="text-gray-700">13 (8 English service, 5 Kikuyu service)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Summary Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Financial Summary</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            {/* <h3 className="text-xl font-semibold mb-2 text-purple-600">Children's Department</h3> */}
            <p className="text-gray-700">
              <strong>Total Income:</strong> Ksh 1,011,060<br />
              <strong>Total Expenditure:</strong> Ksh 804,000<br />
              <strong>Surplus:</strong> Ksh 207,060
            </p>
          </div>
        </section>

        {/* Conclusion Section */}
        <section className="mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-700">Conclusion</h2>
          <div className="bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-gray-700 leading-relaxed">
              The year 2023 was a year of growth and challenges for St. Philip's Kihingo Parish. Despite economic hardships, the church achieved significant milestones in pastoral care, fundraising, and community engagement. We look forward to an even more fruitful 2024.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportPage;