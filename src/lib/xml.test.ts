import { describe, it, expect } from 'vitest';
import { parseStringPromise } from 'xml2js';

/**
 * Ticimax'tan gelen karmaşık ve "kirli" bir XML örneği
 */
const MOCK_TICIMAX_XML = `
<envelope>
    <body>
        <GetKategorilerResponse>
            <Result>
                <Kategori>
                    <ID>1001</ID>
                    <Tanim>Sneaker &amp; Spor Ayakkabı</Tanim>
                    <ParentID>0</ParentID>
                </Kategori>
                <Kategori>
                    <ID>1002</ID>
                    <Tanim><![CDATA[Deri "Hırçın" Botlar]]></Tanim>
                    <ParentID>1001</ParentID>
                </Kategori>
            </Result>
        </GetKategorilerResponse>
    </body>
</envelope>
`;

describe('Ticimax XML Parsing Strategy', () => {

    it('should correctly parse XML and handle special entities like &', async () => {
        const result = await parseStringPromise(MOCK_TICIMAX_XML, { explicitArray: false });
        
        const categories = result.envelope.body.GetKategorilerResponse.Result.Kategori;
        
        // 1. Kategori: & işareti doğru çözülmüş mü?
        expect(categories[0].Tanim).toBe("Sneaker & Spor Ayakkabı");
        
        // 2. Kategori: CDATA ve tırnak işaretleri doğru çözülmüş mü?
        expect(categories[1].Tanim).toBe('Deri "Hırçın" Botlar');
    });

    it('should extract correct Parent-Child relationship', async () => {
        const result = await parseStringPromise(MOCK_TICIMAX_XML, { explicitArray: false });
        const categories = result.envelope.body.GetKategorilerResponse.Result.Kategori;

        expect(categories[1].ParentID).toBe("1001");
        expect(categories[0].ParentID).toBe("0");
    });

});
