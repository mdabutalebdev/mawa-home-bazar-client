"use client";

import React, { useEffect } from 'react';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import HeroSection from './HeroSection';
import PromoBanner from './PromoBanner';
import CategoryExpertise from './CategoryExpertise';
import ReviewsSection from './ReviewsSection';
import FlashSale from './FlashSale';
import DealsRow from './DealsRow';
// Admin-managed landing sections (Site Content → Home Sections).
import StatsBar from './StatsBar';
import AboutSection from './AboutSection';
import ServicesSection from './ServicesSection';
import FeaturesSection from './FeaturesSection';
import CategoryShowcaseSection from './CategoryShowcaseSection';
import ServiceCompaniesSection from './ServiceCompaniesSection';
import ProductCompaniesSection from './ProductCompaniesSection';
import HowItWorksSection from './HowItWorksSection';
import ExperienceSection from './ExperienceSection';

// Kept referentially stable so RTK Query doesn't churn the cache key each render.
const PRELOAD_QUERY = { limit: 20, page: 1, sort: '-createdAt' };

const NewHomePage: React.FC = () => {
    // These queries no longer feed an on-page product grid — they exist only to
    // signal the preloader once the initial catalog/category data is available.
    const { data: productsData, isLoading, isFetching } = useGetProductsQuery(PRELOAD_QUERY);
    // Only categories the admin has toggled to show on the homepage.
    const { data: categoriesData } = useGetCategoriesQuery({ home: true });

    // Signal the preloader once both products and categories are available.
    useEffect(() => {
        const productsReady = !isLoading && !isFetching && !!productsData;
        const categoriesReady = !!categoriesData;
        if (productsReady && categoriesReady) {
            window.dispatchEvent(new CustomEvent('mawahomebazarbd:dataReady'));
        }
    }, [isLoading, isFetching, productsData, categoriesData]);

    return (
        <div
            className="min-h-screen"
            style={{
                // Site-wide soft warm off-white; white cards sit on top for a
                // clean, professional contrast.
                background: '#FBF9F5',
            }}
        >
            <HeroSection />
            {/* Services — image cards right under the hero. Each opens the
                service-request form (admin-managed). */}
            <ServicesSection />
            {/* Company services — partner/service-provider logo cards. Sits
                directly under "Our Services" (admin-managed). */}
            <ServiceCompaniesSection />
            {/* Product companies — category style cards for manufacturing/import companies. */}
            <ProductCompaniesSection />
            {/* Highlight stats (admin-managed). */}
            <StatsBar />
            <CategoryExpertise />
            {/* About us — first content section (admin-managed). */}
            <AboutSection />
            <FlashSale />
            <DealsRow />
            {/* Special features (admin-managed). */}
            <FeaturesSection />

            {/* Promo banner — admin-managed. */}
            <PromoBanner />

            {/* Category chip strip — hidden by default because
                <CategoryExpertise /> at the top of the page already
                renders the dense shopbasebd-style category grid. If the
                admin re-enables the "Category Showcase" section from
                Site Content, the chip list appears here too. */}
            <CategoryShowcaseSection />
            {/* How it works — numbered step cards (admin-managed). */}
            <HowItWorksSection />
            {/* Experience — achievement cards. */}
            <ExperienceSection />
            {/* Dropshipper reviews — admin-managed testimonial carousel. */}
            <ReviewsSection />
        </div>
    );
};

export default NewHomePage;
