# placeYface

This is a photography portfolio built with Next.js and Cloudflare R2.

## Project Architecture

The project is a standard Next.js application.

-   `app/`: Contains the application's pages and API routes.
-   `components/`: Contains the application's React components.
-   `lib/`: Contains the application's library code, including the Cloudflare R2 client.
-   `types/`: Contains the application's TypeScript type definitions.
-   `public/`: Contains the application's public assets.

## R2 Folder Structure

The project requires the following folder structure in your Cloudflare R2 bucket:

-   `originals/`: Contains the original, high-resolution images.
-   `thumbnails/`: Contains the smaller, web-optimized images.

The application fetches images from the `thumbnails` folder and displays them in the gallery. When a user clicks on an image, the application displays the corresponding image from the `originals` folder in a lightbox.

## Required .env variables

The following environment variables are required to run the application:

-   `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID.
-   `CLOUDFLARE_ACCESS_KEY_ID`: Your Cloudflare R2 access key ID.
-   `CLOUDFLARE_SECRET_ACCESS_KEY`: Your Cloudflare R2 secret access key.
-   `CLOUDFLARE_R2_BUCKET_NAME_THUMBS`: The name of your Cloudflare R2 bucket for thumbnails.
-   `CLOUDFLARE_PUBLIC_DEVELOPMENT_URL`: The public URL of your Cloudflare R2 bucket for original images.
-   `CLOUDFLARE_PUBLIC_DEVELOPMENT_URL_THUMBS`: The public URL of your Cloudflare R2 bucket for thumbnails.
