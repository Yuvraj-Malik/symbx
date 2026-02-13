import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Factory, Package, FlaskConical, TrendingUp, PlusCircle, Search } from "lucide-react";
import api from "../api/axios";
import PageWrapper from "../components/PageWrapper";
import StatCard from "../components/StatCard";
import ListingCard from "../components/ListingCard";
import SkeletonCard from "../components/SkeletonCard";
import EmptyState from "../components/EmptyState";

export default function Dashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/listings")
      .then((res) => setListings(res.data))
      .catch((err) => console.error("Failed to load listings:", err))
      .finally(() => setLoading(false));
  }, []);

  const offers = listings.filter((l) => l.type === "OFFER");
  const demands = listings.filter((l) => l.type === "DEMAND");
  const totalChemicals = new Set(
    listings.flatMap((l) => (l.composition || []).map((c) => c.chem_id || c.chemical?.id))
  ).size;

  return (
    <PageWrapper>
      {/* Hero Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Marketplace <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          One factory's waste is another factory's raw material. Browse, match, and exchange.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Factory} label="Active Offers" value={offers.length} color="blue" delay={0} />
        <StatCard icon={Package} label="Active Demands" value={demands.length} color="orange" delay={0.1} />
        <StatCard icon={FlaskConical} label="Chemicals Tracked" value={totalChemicals} color="purple" delay={0.2} />
        <StatCard icon={TrendingUp} label="Total Listings" value={listings.length} color="green" delay={0.3} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link to="/post" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Post Listing
        </Link>
        <Link to="/search" className="btn-accent flex items-center gap-2">
          <Search className="w-4 h-4" /> Smart Search
        </Link>
      </div>

      {/* Listings Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Listings</h2>
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
          {listings.map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
