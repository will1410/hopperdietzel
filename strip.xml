<xsl:stylesheet version="1.0"
       xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
       xmlns:marc="http://www.loc.gov/MARC21/slim">
 <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
 <xsl:template match="/">
         <xsl:apply-templates/>
 </xsl:template>
 <xsl:template match="marc:datafield[@tag='245']/marc:subfield[@code='a']">
   <marc:subfield code="a">
       <xsl:value-of select="translate(current(),'ja', 'aj')"/>
   </marc:subfield>
 </xsl:template>
 <xsl:template match="node()">
   <xsl:copy select=".">
     <xsl:copy-of select="@*"/>
     <xsl:apply-templates/>
   </xsl:copy>
 </xsl:template>
 </xsl:stylesheet>