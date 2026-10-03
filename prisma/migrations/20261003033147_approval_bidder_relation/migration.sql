-- AddForeignKey
ALTER TABLE "WinnerApproval" ADD CONSTRAINT "WinnerApproval_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
