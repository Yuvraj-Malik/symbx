import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Factory, Package, FlaskConical, TrendingUp, PlusCircle, Search, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import StatCard from "../components/StatCard";
import ListingCard from "../components/ListingCard";
import SkeletonCard from "../components/SkeletonCard";
import EmptyState from "../components/EmptyState";
import { useApp } from "../context/AppContext";

export default function Dashboard() {
  const { user } = useApp();
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Load all listings
        const listingsRes = await api.get("/listings");
        setListings(listingsRes.data);

        // Load user's listings
        if (user && token) {
          const myListingsRes = await api.get("/listings/my");
          setMyListings(myListingsRes.data);

          // Load matches for user's listings
          const matchPromises = myListingsRes.data
            .filter(l => l.type === "OFFER")
            .map(async (listing) => {
              try {
                const matchRes = await api.post("/search/match-buyers", {
                  supplyListingId: listing.id
                });
                return {
                  listing,
                  matches: matchRes.data.matches || [],
                  hazards: matchRes.data.hazardWarnings || []
                };
              } catch (err) {
                return { listing, matches: [], hazards: [] };
              }
            });
          
          const matchResults = await Promise.all(matchPromises);
          setMatches(matchResults);
        } else {
          setMyListings([]);
          setMatches([]);
        }
      } catch (err) {
        if (err?.response?.status !== 401) {
          console.error("Failed to load dashboard data:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const offers = listings.filter((l) => l.type === "OFFER");
  const demands = listings.filter((l) => l.type === "DEMAND");
  const myOffers = myListings.filter((l) => l.type === "OFFER");
  const myDemands = myListings.filter((l) => l.type === "DEMAND");
  const totalChemicals = new Set(
    listings.flatMap((l) => (l.composition || []).map((c) => c.chem_id || c.chemical?.id))
  ).size;

  // Company-specific dashboard content
  const getCompanyInfo = () => {
    if (!user) return null;
    
    const email = user.email;
    if (email.includes("ntpc")) {
      return {
        name: "NTPC Dadri - Power Generation",
        role: "Waste Producer",
        description: "Managing fly ash and bottom ash from thermal power generation",
        color: "blue",
        icon: "⚡"
      };
    } else if (email.includes("ultratech")) {
      return {
        name: "UltraTech Cement - Manufacturing",
        role: "Raw Material Buyer",
        description: "Sourcing fly ash and pozzolan for cement production",
        color: "orange",
        icon: "🏗️"
      };
    } else if (email.includes("tatasteel")) {
      return {
        name: "Tata Steel - Steel Production",
        role: "Both Producer & Buyer",
        description: "Managing slag waste while sourcing iron-rich materials",
        color: "gray",
        icon: "🔧"
      };
    } else if (email.includes("greenprocess")) {
      return {
        name: "GreenProcess Technologies",
        role: "Chemical Processor",
        description: "Converting waste chemicals into valuable products",
        color: "green",
        icon: "🧪"
      };
    } else if (email.includes("agritech")) {
      return {
        name: "AgriTech Solutions",
        role: "Organic Processor",
        description: "Converting organic waste into fertilizers",
        color: "emerald",
        icon: "🌱"
      };
    }
    return {
      name: user.name,
      role: "Industry Partner",
      description: "Participating in industrial symbiosis",
      color: "purple",
      icon: "🏭"
    };
  };

  const companyInfo = getCompanyInfo();

  return (
    <PageWrapper>
      {/* Company-Specific Header */}
      {companyInfo && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{companyInfo.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {companyInfo.name}
              </h1>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${companyInfo.color}-100 text-${companyInfo.color}-800 dark:bg-${companyInfo.color}-900/30 dark:text-${companyInfo.color}-300`}>
                  {companyInfo.role}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {companyInfo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company-Specific Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Factory} label="My Offers" value={myOffers.length} color="blue" delay={0} />
        <StatCard icon={Package} label="My Demands" value={myDemands.length} color="orange" delay={0.1} />
        <StatCard icon={CheckCircle} label="Potential Matches" value={matches.filter(m => m.matches.length > 0).length} color="green" delay={0.2} />
        <StatCard icon={AlertCircle} label="Hazard Alerts" value={matches.reduce((sum, m) => sum + m.hazards.length, 0)} color="red" delay={0.3} />
      </div>

      {/* Match Alerts */}
      {matches.some(m => m.matches.length > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Match Opportunities
          </h2>
          <div className="space-y-3">
            {matches.filter(m => m.matches.length > 0).map((match, i) => (
              <div key={i} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      {match.listing.material_name}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {match.matches.length} potential buyer{match.matches.length > 1 ? 's' : ''} found
                    </p>
                  </div>
                  <Link 
                    to={`/match-buyers?listing=${match.listing.id}`}
                    className="btn-green-sm flex items-center gap-1"
                  >
                    View Matches <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {match.hazards.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ {match.hazards.length} hazard warning{match.hazards.length > 1 ? 's' : ''} detected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link to="/post" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Post New Listing
        </Link>
        <Link to="/search" className="btn-accent flex items-center gap-2">
          <Search className="w-4 h-4" /> Smart Search
        </Link>
      </div>

      {/* My Offers */}
      {myOffers.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Offers</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Click a card to manage or match buyers</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {myOffers.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} showManageActions />
            ))}
          </div>
        </div>
      )}

      {/* My Demands */}
      {myDemands.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Demands</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Open a demand to edit or review details</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {myDemands.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} showManageActions />
            ))}
          </div>
        </div>
      )}

      {/* Marketplace Overview */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Marketplace Overview</h2>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="No listings yet"
          description="Be the first to post an industrial waste offer or demand."
          action={<Link to="/post" className="btn-primary">Post First Listing</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.slice(0, 6).map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
