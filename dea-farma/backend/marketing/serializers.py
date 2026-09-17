from rest_framework import serializers

from .models import Banner, Promocao


class BannerSerializer(serializers.ModelSerializer):
    imagem_url = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ["id", "titulo", "subtitulo", "imagem_url", "link", "cta", "ordem"]

    def get_imagem_url(self, obj):
        request = self.context.get("request")
        if obj.imagem:
            url = obj.imagem.url
            return request.build_absolute_uri(url) if request else url
        return None


class PromocaoSerializer(serializers.ModelSerializer):
    produtos = serializers.SlugRelatedField(slug_field="slug", many=True, read_only=True)
    percentual = serializers.SerializerMethodField()

    class Meta:
        model = Promocao
        fields = ["id", "titulo", "descricao", "tipo", "valor", "percentual", "produtos", "fim"]

    def get_percentual(self, obj):
        return obj.valor if obj.tipo == "percentual" else None
