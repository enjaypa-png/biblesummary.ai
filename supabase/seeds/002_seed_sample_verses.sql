-- ============================================================================
-- Sample Bible Verses for Testing
-- ============================================================================
-- Genesis Chapter 1 (31 verses)
-- John Chapter 3 (36 verses)
-- Total: 67 verses for testing the app
-- ============================================================================

-- Genesis Chapter 1
INSERT INTO verses (book_id, chapter, verse, text) VALUES
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 1, 'In the beginning God created the heaven and the earth.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 2, 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 3, 'And God said, Let there be light: and there was light.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 4, 'And God saw the light, that it was good: and God divided the light from the darkness.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 5, 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 6, 'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 7, 'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 8, 'And God called the firmament Heaven. And the evening and the morning were the second day.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 9, 'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 10, 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 11, 'And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 12, 'And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 13, 'And the evening and the morning were the third day.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 14, 'And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 15, 'And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 16, 'And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 17, 'And God set them in the firmament of the heaven to give light upon the earth,'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 18, 'And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 19, 'And the evening and the morning were the fourth day.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 20, 'And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 21, 'And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that it was good.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 22, 'And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 23, 'And the evening and the morning were the fifth day.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 24, 'And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 25, 'And God made the beast of the earth after his kind, and cattle after their kind, and every thing that creepeth upon the earth after his kind: and God saw that it was good.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 26, 'And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 27, 'So God created man in his own image, in the image of God created he him; male and female created he them.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 28, 'And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 29, 'And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 30, 'And to every beast of the earth, and to every fowl of the air, and to every thing that creepeth upon the earth, wherein there is life, I have given every green herb for meat: and it was so.'),
  ((SELECT id FROM books WHERE slug = 'genesis'), 1, 31, 'And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.');

-- John Chapter 3
INSERT INTO verses (book_id, chapter, verse, text) VALUES
  ((SELECT id FROM books WHERE slug = 'john'), 3, 1, 'There was a man of the Pharisees, named Nicodemus, a ruler of the Jews:'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 2, 'The same came to Jesus by night, and said unto him, Rabbi, we know that thou art a teacher come from God: for no man can do these miracles that thou doest, except God be with him.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 3, 'Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 4, 'Nicodemus saith unto him, How can a man be born when he is old? can he enter the second time into his mother’s womb, and be born?'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 5, 'Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 6, 'That which is born of the flesh is flesh; and that which is born of the Spirit is spirit.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 7, 'Marvel not that I said unto thee, Ye must be born again.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 8, 'The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 9, 'Nicodemus answered and said unto him, How can these things be?'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 10, 'Jesus answered and said unto him, Art thou a master of Israel, and knowest not these things?'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 11, 'Verily, verily, I say unto thee, We speak that we do know, and testify that we have seen; and ye receive not our witness.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 12, 'If I have told you earthly things, and ye believe not, how shall ye believe, if I tell you of heavenly things?'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 13, 'And no man hath ascended up to heaven, but he that came down from heaven, even the Son of man which is in heaven.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 14, 'And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 15, 'That whosoever believeth in him should not perish, but have eternal life.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 17, 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 18, 'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 19, 'And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 20, 'For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 21, 'But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 22, 'After these things came Jesus and his disciples into the land of Judaea; and there he tarried with them, and baptized.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 23, 'And John also was baptizing in Aenon near to Salim, because there was much water there: and they came, and were baptized.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 24, 'For John was not yet cast into prison.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 25, 'Then there arose a question between some of John’s disciples and the Jews about purifying.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 26, 'And they came unto John, and said unto him, Rabbi, he that was with thee beyond Jordan, to whom thou barest witness, behold, the same baptizeth, and all men come to him.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 27, 'John answered and said, A man can receive nothing, except it be given him from heaven.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 28, 'Ye yourselves bear me witness, that I said, I am not the Christ, but that I am sent before him.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 29, 'He that hath the bride is the bridegroom: but the friend of the bridegroom, which standeth and heareth him, rejoiceth greatly because of the bridegroom’s voice: this my joy therefore is fulfilled.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 30, 'He must increase, but I must decrease.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 31, 'He that cometh from above is above all: he that is of the earth is earthly, and speaketh of the earth: he that cometh from heaven is above all.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 32, 'And what he hath seen and heard, that he testifieth; and no man receiveth his testimony.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 33, 'He that hath received his testimony hath set to his seal that God is true.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 34, 'For he whom God hath sent speaketh the words of God: for God giveth not the Spirit by measure unto him.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 35, 'The Father loveth the Son, and hath given all things into his hand.'),
  ((SELECT id FROM books WHERE slug = 'john'), 3, 36, 'He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him.');

-- Verify insertion
SELECT
  b.name,
  v.chapter,
  COUNT(*) as verse_count
FROM verses v
JOIN books b ON b.id = v.book_id
GROUP BY b.name, v.chapter
ORDER BY b.order_index, v.chapter;

-- Expected results:
-- Genesis, Chapter 1: 31 verses
-- John, Chapter 3: 36 verses
