from rest_framework.views import APIView
from django.core.paginator import Paginator
from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from rest_framework import status
from .serializers import ProductSerializer
from .models import Product
from django.db.models.functions import Lower
from django.db.models import Value
import json
from django.core.serializers.json import DjangoJSONEncoder
from datetime import datetime
import io
from django.http import FileResponse
from reportlab.pdfgen import canvas
from django.shortcuts import get_object_or_404
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Image, Spacer
from reportlab.platypus import Spacer
from reportlab.lib.pagesizes import A4
from .models import Category
from config.tasks import authenticate_user_task 

class ProductList(APIView):    
    def get(self, request, *args, **kwargs):
        page = kwargs.get('page') 
        
        queryset = Product.objects.all().order_by('id')
        if not queryset.exists():        
            return Response({'message': 'No record(s) found.'}, status.HTTP_400_BAD_REQUEST)
        else:

            perpage = 5
            paginator = Paginator(queryset, perpage)
            page_obj = paginator.get_page(page)

            serialized_data = list(page_obj.object_list.values())


            pageData = {
                'page': page,
                'totpage': paginator.num_pages,
                'totalrecords': paginator.count,
                'products': serialized_data                
            }

            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.productlist.success'
            )

            return Response(pageData, status.HTTP_200_OK)
        
        
        
class ProductSearch(APIView):    
    def get(self, request, *args, **kwargs):
        page = kwargs.get('page')
        key = kwargs.get('key')  
        
        queryset = Product.objects.all().order_by('id')
 
        findQuery = queryset.filter(
            descriptions__iregex=key
        )
                
        serializer_class = ProductSerializer(findQuery, many=True)         
        perpage = 5
        paginator = Paginator(findQuery, perpage)
        page_obj = paginator.get_page(page)

        serialized_data = list(page_obj.object_list.values())
        if paginator.count > 0:                
            pageData = {
                'page': page,
                'totpage': paginator.num_pages,
                'totalrecords': paginator.count,
                'products': serialized_data                
            }            

            # AMQP IMPLEMENTATION
            authenticate_user_task.apply_async(
                args=['guests', 'guests'],
                exchange='central_topic',
                routing_key='auth.productsearch.success'
            )


            return Response(pageData, status.HTTP_200_OK)
        
        else:
            return Response({'message': 'No record(s) found.'}, status.HTTP_400_BAD_REQUEST)


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        # Change the position (x, y) as needed
        self.setFont("Helvetica", 9)
        self.drawRightString(self._pagesize[0] - 0.5*inch, 0.5*inch,
                             f"Page {self._pageNumber} of {page_count}")

class ProductReport(APIView):
    def get(self, request):
        products = Product.objects.all()
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            leftMargin=0.5*inch,
            rightMargin=0.5*inch, 
            topMargin=1.5*inch, # Increased to leave room for logo/header
            bottomMargin=0.5*inch
        )
        
        elements = [] 
        styles = getSampleStyleSheet()

        # Table Data
        data = [['ID', 'Description', 'Qty', 'Unit', 'CostPrice', 'SellPrice']]
        for p in products:
            data.append([p.id, p.descriptions, p.qty, p.unit, p.costprice, p.sellprice])
            
        table = Table(data, colWidths=[40, 200, 50, 50, 80, 80], repeatRows=1) 
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))

        elements.append(Spacer(1, 0.1 * inch))         
        elements.append(table)

        def add_header_footer(canvas, doc):
            canvas.saveState()            
            page_center = doc.pagesize[0] / 2
                        
            logo_path = "static/images/logo2.png" 
            logo_width = 150
            logo_height = 50 
            logo_x = page_center - (logo_width / 2)
            logo_y = doc.pagesize[1] - 0.8 * inch

            # if doc.page == 1:
            canvas.drawImage(logo_path, logo_x, logo_y, width=logo_width, height=logo_height, preserveAspectRatio=True, mask='auto')

            # 2. Centering the Title
            canvas.setFont('Helvetica-Bold', 16)
            title_y = logo_y - 20 # Place it just below the logo
            canvas.drawCentredString(page_center, title_y, "Product Report")

            current_date = datetime.now().strftime("%B %d, %Y")
            subtitle_text = f"As of {current_date}"

            canvas.setFont('Helvetica', 11) 
            subtitle_y = title_y - 15       
            canvas.drawCentredString(page_center, subtitle_y, subtitle_text)                            
            canvas.restoreState()

        doc.build(elements, 
            onFirstPage=add_header_footer, 
            onLaterPages=add_header_footer, 
            canvasmaker=NumberedCanvas)
        
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename='product_report.pdf')


class ProductsCategoryReport(APIView):
    def get(self, request):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Content Generation
        categories = Category.objects.prefetch_related('products').all()
        for category in categories:
            story.append(Paragraph(f"Category: {category.name}", styles['Heading2']))
            
            data = [['Description', 'Unit', 'Qty', 'Cost', 'Sell']]
            for p in category.products.all():
                data.append([p.descriptions[:30], p.unit or '-', str(p.qty), 
                             f"{p.costprice:.2f}", f"{p.sellprice:.2f}"])
            
            t = Table(data, colWidths=[200, 60, 50, 70, 70])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ]))
            story.append(t)
            story.append(Spacer(1, 20))

        # Footer & Header Function
        def header_footers_pages(canvas, doc):
            canvas.saveState()
            current_date = datetime.now().strftime("%B %d, %Y")
            canvas.setFont('Helvetica-Bold', 12)
            
            # y=11 * inch is near the very top of an A4 page (11.69 inches tall)
            header_top = 11 * inch 
            
            # Draw Title
            canvas.drawString(inch, header_top, "Product Inventory Report")
            
            # Draw Date slightly lower
            canvas.setFont('Helvetica', 10)
            canvas.drawString(inch, header_top - 15, f"As of {current_date}")
            
            # Page Number
            page_num = canvas.getPageNumber()
            canvas.drawRightString(7.5 * inch, 0.75 * inch, f"Page {page_num}")
            canvas.restoreState()            
            # canvas.saveState()
            # # Subtitle (Top Left)
            # current_date = datetime.now().strftime("%B %d, %Y")
            # canvas.setFont('Helvetica', 10)
            # canvas.drawString(inch, 10.5 * inch, f"Product Inventory Report \n As of {current_date}")
            
            # # Page Number (Bottom Right)
            # page_num = canvas.getPageNumber()
            # canvas.drawRightString(7.5 * inch, 0.75 * inch, f"Page {page_num}")
            # canvas.restoreState()

        # Build the PDF
        doc.build(story, onFirstPage=header_footers_pages, onLaterPages=header_footers_pages)

        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename='report.pdf')


# class ProductsCategoryReport(APIView):    
#     def get(self, request):
#         # Create a file-like buffer to receive PDF data.
#         buffer = io.BytesIO()
        
#         # Create the doc template
#         doc = SimpleDocTemplate(buffer, pagesize=A4)
#         styles = getSampleStyleSheet()
#         story = []

#         # Title
#         story.append(Paragraph("Product Inventory Report", styles['Title']))
#         story.append(Spacer(1, 12))
#         current_date = datetime.now().strftime("%B %d, %Y")

#         subtitle_text = f"As of {current_date}"
#         story.append(Paragraph(subtitle_text, styles['Normal']))

#         categories = Category.objects.prefetch_related('products').all()

#         for category in categories:
#             # MASTER: Category Name
#             story.append(Paragraph(f"{category.name}", styles['Heading2']))
#             story.append(Spacer(1, 5))

#             # DETAILS: Product Table Headers
#             data = [['Description', 'Unit', 'Qty', 'Cost', 'Sell']]
            
#             # Add product rows
#             products = category.products.all()
#             if products.exists():
#                 for p in products:
#                     data.append([
#                         p.descriptions[:30], # Truncate for layout
#                         p.unit or '-',
#                         str(p.qty),
#                         f"{p.costprice:.2f}",
#                         f"{p.sellprice:.2f}"
#                     ])
                
#                 # Create Table
#                 t = Table(data, colWidths=[200, 60, 50, 70, 70])
#                 t.setStyle(TableStyle([
#                     ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
#                     ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
#                     ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
#                     ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
#                     ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
#                     ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
#                     ('GRID', (0, 0), (-1, -1), 1, colors.black),
#                 ]))
#                 story.append(t)
#             else:
#                 story.append(Paragraph("No products in this category.", styles['Italic']))

#             story.append(Spacer(1, 20))

#         # Build PDF
#         doc.build(story)

#         # Return the response
#         buffer.seek(0)
#         return FileResponse(buffer, as_attachment=False, filename="product_report.pdf")

