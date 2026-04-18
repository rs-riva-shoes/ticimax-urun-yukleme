import { Undo2, Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditProductPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8 max-w-2xl mx-auto mt-12 space-y-6 text-center">
      <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Wrench className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-800">Ürün Düzenleme</h1>
      <p className="text-stone-500 text-lg">
        Bu ürünün (ID: {params.id}) düzenleme sayfası henüz yapım aşamasındadır. Yakında eklenecektir!
      </p>
      
      <div className="pt-8">
        <Link href="/products">
          <Button variant="outline" className="gap-2">
            <Undo2 className="w-4 h-4" />
            Ürünlere Dön
          </Button>
        </Link>
      </div>
    </div>
  );
}
