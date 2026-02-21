import { features } from "@/app/features";
import { FeatureCard } from "./FeatureCard";

interface FeatureCardListProps {
  onConsultClick: () => void;
}

export function FeatureCardList({ onConsultClick }: FeatureCardListProps) {
  return (
    <section id="tools" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onConsultClick={onConsultClick}
            />
          ))}
        </div>
      </div>
    </section>
  )
}