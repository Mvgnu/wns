-- AlterTable to add coordinates columns to Group if they don't already exist
-- Using conditional logic to avoid errors if columns already exist

-- For PostgreSQL:
DO $$
BEGIN
    -- Check if the latitude column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name='Group' AND column_name='latitude'
    ) THEN
        -- Add the latitude column
        ALTER TABLE "Group" ADD COLUMN "latitude" DOUBLE PRECISION;
    END IF;

    -- Check if the longitude column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name='Group' AND column_name='longitude'
    ) THEN
        -- Add the longitude column
        ALTER TABLE "Group" ADD COLUMN "longitude" DOUBLE PRECISION;
    END IF;
END $$;

-- Create index for geospatial queries if not exists
CREATE INDEX IF NOT EXISTS "Group_latitude_longitude_idx" ON "Group"("latitude", "longitude"); 