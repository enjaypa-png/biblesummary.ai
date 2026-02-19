-- ============================================================================
-- BibleSummary.ai - Seed Clear Translation (CT) verses for 1, 2, 3 John
-- ============================================================================
-- Inserts all CT verse data for 1 John (chapters 1-5), 2 John, and 3 John.
-- Uses ON CONFLICT to upsert so this migration is idempotent.
-- ============================================================================

DO $$
DECLARE
  v_1john_id UUID;
  v_2john_id UUID;
  v_3john_id UUID;
BEGIN
  -- Look up book IDs by slug
  SELECT id INTO v_1john_id FROM books WHERE slug = '1-john';
  SELECT id INTO v_2john_id FROM books WHERE slug = '2-john';
  SELECT id INTO v_3john_id FROM books WHERE slug = '3-john';

  -- Validate that all books were found
  IF v_1john_id IS NULL THEN
    RAISE EXCEPTION 'Book with slug "1-john" not found in books table';
  END IF;
  IF v_2john_id IS NULL THEN
    RAISE EXCEPTION 'Book with slug "2-john" not found in books table';
  END IF;
  IF v_3john_id IS NULL THEN
    RAISE EXCEPTION 'Book with slug "3-john" not found in books table';
  END IF;

  -- ==========================================================================
  -- 1 JOHN CHAPTER 1 (10 verses)
  -- ==========================================================================

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 1, 'We declare to you what was from the beginning — what we have heard, what we have seen with our eyes, what we have looked at, and what our hands have touched — concerning the Word of life.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 2, 'This life was revealed, and we have seen it. We testify to it and declare to you the eternal life that was with the Father and was revealed to us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 3, 'What we have seen and heard, we declare to you also, so that you too may have fellowship with us. And our fellowship is with the Father and with his Son Jesus Christ.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 4, 'We are writing these things to you so that our joy may be complete.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 5, 'This is the message we have heard from him and declare to you: God is light, and there is no darkness in him at all.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 6, 'If we say we have fellowship with him but walk in darkness, we are lying and not living by the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 7, 'But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus Christ his Son cleanses us from all sin.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 8, 'If we say we have no sin, we are deceiving ourselves, and the truth is not in us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 9, 'If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 1, 10, 'If we say we have not sinned, we make him a liar, and his word is not in us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  -- ==========================================================================
  -- 1 JOHN CHAPTER 2 (29 verses)
  -- ==========================================================================

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 1, 'My dear children, I am writing these things to you so that you will not sin. But if anyone does sin, we have an advocate with the Father — Jesus Christ, the righteous one.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 2, 'He is the atonement for our sins, and not for ours only, but also for the sins of the whole world.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 3, 'This is how we know that we know him: if we obey his commandments.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 4, 'Whoever says, "I know him," but does not obey his commandments is a liar, and the truth is not in that person.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 5, 'But whoever obeys his word, in that person the love of God is truly made complete. This is how we know we are in him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 6, 'Whoever claims to remain in him should live the same way he lived.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 7, 'Brothers and sisters, I am not writing a new commandment to you, but an old commandment that you have had from the beginning. The old commandment is the word that you heard from the beginning.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 8, 'Yet I am writing a new commandment to you, which is true in him and in you, because the darkness is passing away and the true light is already shining.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 9, 'Whoever says he is in the light but hates his brother is still in darkness.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 10, 'Whoever loves his brother remains in the light, and there is nothing in him to cause stumbling.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 11, 'But whoever hates his brother is in darkness and walks in darkness. He does not know where he is going, because the darkness has blinded his eyes.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 12, 'I am writing to you, dear children, because your sins have been forgiven through his name.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 13, 'I am writing to you, fathers, because you have known him who is from the beginning. I am writing to you, young men, because you have overcome the evil one. I am writing to you, dear children, because you have known the Father.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 14, 'I have written to you, fathers, because you have known him who is from the beginning. I have written to you, young men, because you are strong, and the word of God remains in you, and you have overcome the evil one.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 15, 'Do not love the world or the things in the world. If anyone loves the world, the love of the Father is not in him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 16, 'For everything in the world — the desires of the flesh, the desires of the eyes, and the pride of life — is not from the Father but from the world.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 17, 'The world and its desires are passing away, but whoever does the will of God remains forever.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 18, 'Dear children, it is the last hour. Just as you have heard that the antichrist is coming, even now many antichrists have appeared. This is how we know it is the last hour.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 19, 'They went out from us, but they did not really belong to us. If they had belonged to us, they would have stayed with us. But they left so that it would be clear that none of them belonged to us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 20, 'But you have an anointing from the Holy One, and you all know the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 21, 'I have not written to you because you do not know the truth, but because you do know it, and because no lie comes from the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 22, 'Who is the liar? It is whoever denies that Jesus is the Christ. This is the antichrist — the one who denies the Father and the Son.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 23, 'Whoever denies the Son does not have the Father either. Whoever acknowledges the Son has the Father also.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 24, 'Let what you heard from the beginning remain in you. If what you heard from the beginning remains in you, then you also will remain in the Son and in the Father.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 25, 'This is what he promised us — eternal life.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 26, 'I am writing these things to you about those who are trying to lead you astray.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 27, 'But the anointing you received from him remains in you, and you do not need anyone to teach you. Instead, his anointing teaches you about all things. That anointing is true and is not a lie. Just as it has taught you, remain in him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 28, 'Now, dear children, remain in him, so that when he appears we may be confident and not be ashamed before him when he comes.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 2, 29, 'If you know that he is righteous, you know that everyone who does what is right has been born of him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  -- ==========================================================================
  -- 1 JOHN CHAPTER 3 (24 verses)
  -- ==========================================================================

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 1, 'See what great love the Father has given us, that we should be called children of God — and that is what we are! The reason the world does not know us is that it did not know him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 2, 'Dear friends, we are already children of God, and what we will be has not yet been revealed. But we know that when he appears, we will be like him, because we will see him as he is.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 3, 'Everyone who has this hope in him purifies himself, just as he is pure.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 4, 'Everyone who commits sin breaks the law, because sin is the breaking of the law.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 5, 'You know that he appeared to take away our sins, and in him there is no sin.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 6, 'Whoever remains in him does not keep on sinning. Whoever keeps on sinning has not seen him or known him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 7, 'Dear children, do not let anyone lead you astray. Whoever does what is right is righteous, just as he is righteous.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 8, 'Whoever makes a practice of sinning belongs to the devil, because the devil has been sinning from the beginning. The reason the Son of God appeared was to destroy the works of the devil.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 9, 'Whoever has been born of God does not make a practice of sinning, because God''s seed remains in him. He cannot go on sinning, because he has been born of God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 10, 'This is how the children of God and the children of the devil are revealed: whoever does not do what is right is not of God, and neither is the one who does not love his brother.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 11, 'For this is the message you heard from the beginning: we should love one another.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 12, 'Do not be like Cain, who belonged to the evil one and murdered his brother. And why did he murder him? Because his own actions were evil and his brother''s were righteous.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 13, 'Do not be surprised, brothers and sisters, if the world hates you.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 14, 'We know that we have passed from death to life, because we love our brothers and sisters. Whoever does not love remains in death.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 15, 'Everyone who hates his brother is a murderer, and you know that no murderer has eternal life remaining in him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 16, 'This is how we know what love is: he laid down his life for us. And we should lay down our lives for our brothers and sisters.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 17, 'If anyone has material possessions and sees his brother in need but closes his heart against him, how can the love of God remain in that person?', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 18, 'Dear children, let us not love with words or with our tongues, but with actions and in truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 19, 'This is how we will know that we belong to the truth, and how we will set our hearts at rest in his presence.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 20, 'For if our hearts condemn us, God is greater than our hearts, and he knows everything.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 21, 'Dear friends, if our hearts do not condemn us, we have confidence before God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 22, 'Whatever we ask, we receive from him, because we obey his commandments and do what pleases him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 23, 'This is his commandment: that we believe in the name of his Son Jesus Christ and love one another, just as he commanded us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 3, 24, 'Whoever obeys his commandments remains in him, and he in them. This is how we know that he remains in us: by the Spirit he has given us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  -- ==========================================================================
  -- 1 JOHN CHAPTER 4 (21 verses)
  -- ==========================================================================

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 1, 'Dear friends, do not believe every spirit, but test the spirits to see whether they are from God, because many false prophets have gone out into the world.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 2, 'This is how you recognize the Spirit of God: every spirit that acknowledges that Jesus Christ has come in the flesh is from God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 3, 'Every spirit that does not acknowledge Jesus is not from God. This is the spirit of the antichrist, which you have heard is coming, and is already in the world even now.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 4, 'You are from God, dear children, and you have overcome them, because the one who is in you is greater than the one who is in the world.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 5, 'They are from the world. That is why they speak from the world''s perspective, and the world listens to them.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 6, 'We are from God. Whoever knows God listens to us; whoever is not from God does not listen to us. This is how we recognize the spirit of truth and the spirit of error.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 7, 'Dear friends, let us love one another, because love comes from God. Everyone who loves has been born of God and knows God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 8, 'Whoever does not love does not know God, because God is love.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 9, 'This is how God showed his love among us: he sent his one and only Son into the world so that we might live through him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 10, 'This is love: not that we loved God, but that he loved us and sent his Son as the atonement for our sins.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 11, 'Dear friends, since God loved us so much, we also should love one another.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 12, 'No one has ever seen God. But if we love one another, God remains in us, and his love is made complete in us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 13, 'This is how we know that we remain in him and he in us: he has given us of his Spirit.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 14, 'We have seen and testify that the Father has sent the Son to be the Savior of the world.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 15, 'Whoever acknowledges that Jesus is the Son of God, God remains in him, and he in God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 16, 'We have come to know and to believe the love that God has for us. God is love, and whoever remains in love remains in God, and God remains in him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 17, 'In this way, love is made complete among us so that we will have confidence on the day of judgment, because as he is, so are we in this world.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 18, 'There is no fear in love. Instead, perfect love drives out fear, because fear involves punishment. The one who fears has not been made complete in love.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 19, 'We love because he first loved us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 20, 'If someone says, "I love God," but hates his brother, he is a liar. For whoever does not love his brother, whom he has seen, cannot love God, whom he has not seen.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 4, 21, 'This is the commandment we have from him: whoever loves God must also love his brother.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  -- ==========================================================================
  -- 1 JOHN CHAPTER 5 (21 verses)
  -- ==========================================================================

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 1, 'Everyone who believes that Jesus is the Christ has been born of God, and everyone who loves the Father also loves those born of him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 2, 'This is how we know that we love the children of God: by loving God and obeying his commandments.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 3, 'For this is the love of God: that we obey his commandments. And his commandments are not burdensome.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 4, 'For everyone born of God overcomes the world. And this is the victory that has overcome the world — our faith.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 5, 'Who is it that overcomes the world? Only the one who believes that Jesus is the Son of God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 6, 'This is the one who came by water and blood — Jesus Christ. He did not come by water only, but by water and blood. And it is the Spirit who testifies, because the Spirit is truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 7, 'For there are three that testify in heaven: the Father, the Word, and the Holy Spirit — and these three are one.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 8, 'And there are three that testify on earth: the Spirit, the water, and the blood — and these three are in agreement.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 9, 'If we accept the testimony of people, the testimony of God is greater. For this is the testimony of God, which he has given about his Son.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 10, 'Whoever believes in the Son of God has the testimony within himself. Whoever does not believe God has made him a liar, because he has not believed the testimony that God has given about his Son.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 11, 'This is the testimony: God has given us eternal life, and this life is in his Son.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 12, 'Whoever has the Son has life. Whoever does not have the Son of God does not have life.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 13, 'I have written these things to you who believe in the name of the Son of God, so that you may know that you have eternal life.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 14, 'This is the confidence we have in approaching God: if we ask anything according to his will, he hears us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 15, 'And if we know that he hears us — whatever we ask — we know that we have what we asked of him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 16, 'If anyone sees his brother committing a sin that does not lead to death, he should pray, and God will give him life. I am speaking about those whose sin does not lead to death. There is a sin that leads to death. I am not saying he should pray about that.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 17, 'All wrongdoing is sin, but there is sin that does not lead to death.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 18, 'We know that everyone who has been born of God does not keep on sinning. The one who was born of God keeps him safe, and the evil one cannot harm him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 19, 'We know that we are from God, and the whole world lies under the power of the evil one.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 20, 'We know that the Son of God has come and has given us understanding, so that we may know him who is true. And we are in him who is true — in his Son Jesus Christ. He is the true God and eternal life.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_1john_id, 5, 21, 'Dear children, keep yourselves from idols. Amen.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  -- ==========================================================================
  -- 2 JOHN CHAPTER 1 (13 verses)
  -- ==========================================================================

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 1, 'From the elder, to the chosen lady and her children, whom I love in the truth — and not I alone, but also all who know the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 2, 'We love you because of the truth that remains in us and will be with us forever.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 3, 'Grace, mercy, and peace from God the Father and from Jesus Christ, the Son of the Father, will be with us in truth and love.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 4, 'I was overjoyed to find some of your children walking in the truth, just as the Father commanded us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 5, 'Now I ask you, dear lady — not as though I am writing you a new commandment, but one we have had from the beginning — that we love one another.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 6, 'This is love: that we walk according to his commandments. This is the commandment, just as you have heard from the beginning: you should walk in love.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 7, 'For many deceivers have gone out into the world — those who do not acknowledge that Jesus Christ came in the flesh. Any such person is a deceiver and an antichrist.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 8, 'Watch out for yourselves, so that you do not lose what we have worked for, but may receive your full reward.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 9, 'Anyone who goes too far and does not remain in the teaching of Christ does not have God. Whoever remains in the teaching has both the Father and the Son.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 10, 'If anyone comes to you and does not bring this teaching, do not receive him into your home or welcome him.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 11, 'For whoever welcomes him shares in his evil deeds.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 12, 'I have many things to write to you, but I would rather not use paper and ink. Instead, I hope to come to you and speak face to face, so that our joy may be complete.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_2john_id, 1, 13, 'The children of your chosen sister send you their greetings. Amen.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  -- ==========================================================================
  -- 3 JOHN CHAPTER 1 (14 verses)
  -- ==========================================================================

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 1, 'From the elder, to my dear friend Gaius, whom I love in the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 2, 'Dear friend, I pray that you may prosper in every way and be in good health, just as your soul is prospering.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 3, 'I was overjoyed when brothers and sisters came and testified about your faithfulness to the truth and how you are walking in the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 4, 'I have no greater joy than to hear that my children are walking in the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 5, 'Dear friend, you are showing faithfulness in whatever you do for the brothers and sisters, even though they are strangers to you.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 6, 'They have testified about your love before the church. You will do well to send them on their way in a manner worthy of God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 7, 'For they went out for the sake of his name, accepting nothing from the Gentiles.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 8, 'Therefore we should welcome such people, so that we may work together for the truth.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 9, 'I wrote to the church, but Diotrephes, who loves to be first among them, does not welcome us.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 10, 'So if I come, I will call attention to what he is doing — spreading malicious nonsense about us. Not satisfied with that, he refuses to welcome the brothers and sisters himself, and he stops those who want to do so and puts them out of the church.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 11, 'Dear friend, do not imitate what is evil but what is good. Whoever does good is from God. Whoever does evil has not seen God.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 12, 'Demetrius is well spoken of by everyone, and by the truth itself. We also speak well of him, and you know that our testimony is true.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 13, 'I have many things to write to you, but I would rather not write them with ink and pen.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

  INSERT INTO verses (book_id, chapter, verse, text, translation) VALUES
    (v_3john_id, 1, 14, 'I hope to see you soon, and we will speak face to face. Peace to you. The friends here send you their greetings. Greet our friends there by name.', 'ct')
  ON CONFLICT (book_id, chapter, verse, translation) DO UPDATE SET text = EXCLUDED.text;

END $$;
