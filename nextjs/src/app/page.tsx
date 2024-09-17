//import { createClient } from "@/utils/supabase/server";
import { Container } from "@/components/ui/Container";
import { Hero } from "@/components/landing_page/Hero";
import { SectionTitle } from "@/components/landing_page/SectionTitle";
import { Benefits } from "@/components/landing_page/Benefits";
import { Faq } from "@/components/landing_page/Faq";

import { benefitData, featureData } from "@/components/landing_page/data";

export default async function Home() {
    /* Subabase user for later use
    const supabase = createClient();
    {

    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    */

    return (
        <Container>
            <Hero />
            <SectionTitle preTitle="Study Tutor Benefits" title=" Benefits and Features">
                Intelligent Study Tutor creates personalized questions, provides instant feedback,
                and answers all your study-related queries. Whether you’re preparing for exams or
                just need a little extra help, Study Tutor is here to support you every step of the
                way.
            </SectionTitle>
            <Benefits data={benefitData} />
            <Benefits imgPos="right" data={featureData} />
            <SectionTitle preTitle="FAQ" title=" Do you have questions?">
                Below you will find answers to the most frequently asked questions.
            </SectionTitle>
            <Faq />
        </Container>
    );
}
